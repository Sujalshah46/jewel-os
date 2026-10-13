// AI-generated illustrative catalogue photos, served locally so the showroom
// does not depend on third-party image URLs. The original PNGs are retained in
// src/assets/product-photo-originals; the public JPEGs are resized derivatives
// for faster catalogue and inventory rendering.
const images = {
  ring: '/product-photos/ring.jpg',
  diamondRing: '/product-photos/diamond-ring.jpg',
  traditionalRing: '/product-photos/traditional-ring.jpg',
  mensRing: '/product-photos/mens-ring.jpg',
  earrings: '/product-photos/earrings.jpg',
  necklace: '/product-photos/bridal-necklace.jpg',
  fashionNecklace: '/product-photos/fashion-necklace.jpg',
  silverJewellery: '/product-photos/anklet.jpg',
  goldBar: '/product-photos/gold-bar.jpg',
  silverBar: '/product-photos/silver-bar.jpg',
  kada: '/product-photos/kada.jpg',
  diamond: '/product-photos/diamond.jpg',
  gemstone: '/product-photos/emerald.jpg'
};

// Give every seeded showroom item its own suitable photograph, even when old
// localStorage or imported data still contains the previous generic URL.
const seededItemImages = {
  LRING33: images.ring,
  LRING29: images.diamondRing,
  LRING20: images.traditionalRing,
  EARRING1: images.earrings,
  RINGHR3: images.mensRing,
  'CHOKER-01': images.necklace,
  'SILVPAYAL-01': images.silverJewellery,
  'RAWGOLD-100': images.goldBar,
  'RAWSILV-1KG': images.silverBar,
  'IM-BRIDAL-01': images.fashionNecklace,
  'IM-KADA-02': images.kada,
  'DIA-SOL-01': images.diamond,
  'GEM-EM-01': images.gemstone
};

export function getProductImage({ itemCode = '', category = '', subCategory = '', stockType = '', metalType = '' } = {}) {
  if (seededItemImages[itemCode]) return seededItemImages[itemCode];

  const text = `${category} ${subCategory} ${stockType} ${metalType}`.toLowerCase();
  if (text.includes('silver bar') || text.includes('silver ingot') || (text.includes('bullion') && text.includes('silver'))) return images.silverBar;
  if (text.includes('bullion') || text.includes('gold bar')) return images.goldBar;
  if (text.includes('diamond') || text.includes('solitaire')) return text.includes('ring') ? images.diamondRing : images.diamond;
  if (text.includes('emerald') || text.includes('gemstone') || text.includes('panna')) return images.gemstone;
  if (text.includes('earring') || text.includes('jhumka')) return images.earrings;
  if (text.includes('necklace') || text.includes('choker')) return images.necklace;
  if (text.includes('anklet') || text.includes('payal') || text.includes('silver')) return images.silverJewellery;
  if (text.includes('bangle') || text.includes('kada')) return images.kada;
  if (text.includes('ring')) {
    if (text.includes('men') || text.includes('male') || text.includes('gents')) return images.mensRing;
    return text.includes('traditional') || text.includes('floral') ? images.traditionalRing : images.ring;
  }
  return images.ring;
}
