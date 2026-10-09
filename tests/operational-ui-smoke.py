"""Playwright smoke for the operational customer slice; uses synthetic test accounts only."""
import os
import uuid

from playwright.sync_api import sync_playwright


required = [
    "OPERATIONAL_TEST_URL",
    "OPERATIONAL_TEST_EMAIL",
    "OPERATIONAL_TEST_PASSWORD",
    "OPERATIONAL_TEST_TENANT_A_LABEL",
    "OPERATIONAL_TEST_TENANT_B_LABEL",
    "OPERATIONAL_TEST_TENANT_B_CUSTOMER",
]
missing = [name for name in required if not os.environ.get(name)]
if missing:
    raise SystemExit(f"Missing synthetic browser-test inputs: {', '.join(missing)}")

origin = os.environ["OPERATIONAL_TEST_URL"].rstrip("/")
new_customer = f"Browser Tenant A {uuid.uuid4()}"

with sync_playwright() as playwright:
    launch_options = {"headless": True}
    if os.environ.get("PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH"):
        launch_options["executable_path"] = os.environ["PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH"]
    browser = playwright.chromium.launch(**launch_options)
    page = browser.new_page()
    requested_paths = []
    page.on("request", lambda request: requested_paths.append(request.url))
    try:
        page.goto(origin, wait_until="domcontentloaded")
        assert not any(any(fragment in request for fragment in ("src/App.jsx", "JewelleryContext", "initialData")) for request in requested_paths), "operational mode loaded legacy demo code"
        page.get_by_label("Email").fill(os.environ["OPERATIONAL_TEST_EMAIL"])
        page.get_by_label("Password").fill(os.environ["OPERATIONAL_TEST_PASSWORD"])
        page.get_by_role("button", name="Sign in").click()
        page.get_by_label("Authorized tenant").wait_for()

        tenant_a = os.environ["OPERATIONAL_TEST_TENANT_A_LABEL"]
        tenant_b = os.environ["OPERATIONAL_TEST_TENANT_B_LABEL"]
        page.get_by_label("Authorized tenant").select_option(label=tenant_a)
        page.get_by_label("Name").fill(new_customer)
        page.get_by_label("Mobile").fill("9000000099")
        page.get_by_role("button", name="Save customer").click()
        page.get_by_text(new_customer).wait_for()

        page.get_by_label("Authorized tenant").select_option(label=tenant_b)
        page.get_by_text(os.environ["OPERATIONAL_TEST_TENANT_B_CUSTOMER"]).wait_for()
        assert page.get_by_text(new_customer).count() == 0
        page.get_by_role("button", name="Edit").first.click()
        page.get_by_label("Name").fill("Unsaved tenant B draft")

        page.get_by_label("Authorized tenant").select_option(label=tenant_a)
        page.get_by_text(new_customer).wait_for()
        assert page.get_by_label("Name").input_value() == ""
        assert page.get_by_text(new_customer).count() == 1
        assert page.get_by_text(os.environ["OPERATIONAL_TEST_TENANT_B_CUSTOMER"]).count() == 0
        storage_keys = page.evaluate("Object.keys(localStorage)")
        assert not any(key.startswith("JEWELLERY_OS_STATE_") for key in storage_keys)

        forbidden_tenant = str(uuid.uuid4())
        status = page.evaluate("""async (tenantId) => {
          const response = await fetch('/api/customers', { headers: { 'X-Tenant-Id': tenantId } });
          return response.status;
        }""", forbidden_tenant)
        assert status == 403, f"tampered tenant selection returned HTTP {status}"
        print("PASS: browser login, customer create, tenant isolation, draft discard, and direct forged-tenant denial")
    finally:
        browser.close()
