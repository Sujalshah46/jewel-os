// AI-generated illustrative catalogue photos, served locally so the showroom
// does not depend on third-party image URLs. They are not photographs of the
// exact pieces held in inventory; replace with item-specific photos as needed.
const images = {
  ring: '/product-photos/ring.png',
  diamondRing: '/product-photos/diamond-ring.png',
  traditionalRing: '/product-photos/traditional-ring.png',
  mensRing: '/product-photos/mens-ring.png',
  earrings: '/product-photos/earrings.png',
  necklace: '/product-photos/bridal-necklace.png',
  fashionNecklace: '/product-photos/fashion-necklace.png',
  silverJewellery: '/product-photos/anklet.png',
  goldBar: '/product-photos/gold-bar.png',
  silverBar: '/product-photos/silver-bar.png',
  kada: '/product-photos/kada.png',
  diamond: '/product-photos/diamond.png',
  gemstone: '/product-photos/emerald.png'
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
