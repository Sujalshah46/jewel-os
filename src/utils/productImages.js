// Unsplash product photos (free to use under the Unsplash License) and a CC0
// Wikimedia emerald photo. These are illustrative catalogue photos, not the
// exact stock item being sold; merchants should replace them with their own.
const unsplash = (photoId) => `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=900&q=85`;

const images = {
  ring: unsplash('photo-1677466892649-75e21e30dc2c'),
  diamondRing: unsplash('photo-1788495545073-51161449ca9e'),
  traditionalRing: unsplash('photo-1689777238091-59591cdf13e7'),
  mensRing: unsplash('photo-1570932626597-82c2832a1275'),
  earrings: unsplash('photo-1723361656146-f201d215c49c'),
  necklace: unsplash('photo-1617171511579-c2711d7a91f6'),
  fashionNecklace: unsplash('photo-1781901736554-1830ea15021a'),
  silverJewellery: unsplash('photo-1651395835317-d2868e8ebcac'),
  goldBar: unsplash('photo-1633484188069-3289e175e52e'),
  silverBar: unsplash('photo-1693596792761-9b005fb4bfa4'),
  kada: unsplash('photo-1758995116288-278d7387cbb6'),
  diamond: unsplash('photo-1631013636761-c533d81e96a4'),
  gemstone: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Cut_Emerald.jpg'
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
