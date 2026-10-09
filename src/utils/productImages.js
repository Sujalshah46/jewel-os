// Product photography is served by Unsplash. Replace these demo assets with
// the shop's own product photography before publishing a real customer catalog.
const images = {
  ring: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=85',
  diamondRing: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800&auto=format&fit=crop&q=85',
  traditionalRing: 'https://images.unsplash.com/photo-1598560917505-59a3ad559071?w=800&auto=format&fit=crop&q=85',
  earrings: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800&auto=format&fit=crop&q=85',
  necklace: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=85',
  silverJewellery: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=85',
  goldBar: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800&auto=format&fit=crop&q=85',
  silverBar: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=800&auto=format&fit=crop&q=85',
  kada: 'https://images.unsplash.com/photo-1611591475874-884803975d9e?w=800&auto=format&fit=crop&q=85',
  diamond: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800&auto=format&fit=crop&q=85',
  gemstone: 'https://images.unsplash.com/photo-1598560917505-59a3ad559071?w=800&auto=format&fit=crop&q=85'
};

export function getProductImage({ category = '', subCategory = '', stockType = '', metalType = '' } = {}) {
  const text = `${category} ${subCategory} ${stockType} ${metalType}`.toLowerCase();
  if (text.includes('silver bar') || text.includes('silver ingot') || (text.includes('bullion') && text.includes('silver'))) return images.silverBar;
  if (text.includes('bullion') || text.includes('gold bar')) return images.goldBar;
  if (text.includes('diamond') || text.includes('solitaire')) return text.includes('ring') ? images.diamondRing : images.diamond;
  if (text.includes('emerald') || text.includes('gemstone') || text.includes('panna')) return images.gemstone;
  if (text.includes('earring') || text.includes('jhumka')) return images.earrings;
  if (text.includes('necklace') || text.includes('choker')) return images.necklace;
  if (text.includes('anklet') || text.includes('payal') || text.includes('silver')) return images.silverJewellery;
  if (text.includes('bangle') || text.includes('kada')) return images.kada;
  if (text.includes('ring')) return text.includes('traditional') || text.includes('floral') ? images.traditionalRing : images.ring;
  return images.ring;
}
