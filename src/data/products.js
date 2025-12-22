// Import product images
import screwNutImg from '@/assets/images/products/screw-nut.jpg'
import tissuePaperImg from '@/assets/images/products/tissue-paper.jpg'
import steelPipesImg from '@/assets/images/products/steel-pipes.jpg'
import pipeFittingsImg from '@/assets/images/products/pipe-fittings.jpg'
import handToolsImg from '@/assets/images/products/hand-tools.jpg'
import electricalImg from '@/assets/images/products/electrical.jpg'
import mechanicalImg from '@/assets/images/products/mechanical.jpg'
import ppeImg from '@/assets/images/products/ppe.jpg'

export const products = [
  {
    id: 1,
    title: 'Screw Nut Products',
    slug: 'screw-nut',
    description: 'High-quality bolts, nuts, and fasteners crafted from the finest materials with rigorous quality control.',
    icon: 'bolt',
    image: screwNutImg,
    features: ['High tensile strength', 'Corrosion resistant', 'Multiple grades available']
  },
  {
    id: 2,
    title: 'Tissue Paper Products',
    slug: 'tissue-paper',
    description: 'Till rolls, copy paper, labels, tissue paper products, stationery, packaging, tape, and adhesives.',
    icon: 'scroll',
    image: tissuePaperImg,
    features: ['Till rolls', 'Copy paper', 'Cleaning chemicals', 'PPE products']
  },
  {
    id: 3,
    title: 'Steel Pipes',
    slug: 'steel-pipes',
    description: 'Seamless steel pipes, stainless steel pipes, galvanized pipes, I-steel, angle and channel steel.',
    icon: 'cylinder',
    image: steelPipesImg,
    features: ['Seamless construction', 'Multiple diameters', 'Galvanized options']
  },
  {
    id: 4,
    title: 'Pipe Fittings',
    slug: 'pipe-fittings',
    description: 'All kinds of flanges, elbows, tees, PVC, CPPVC, and HDPE piping systems.',
    icon: 'git-branch',
    image: pipeFittingsImg,
    features: ['Flange products', 'Elbow products', 'Rotational molded']
  },
  {
    id: 5,
    title: 'Hand & Power Tools',
    slug: 'hand-power-tools',
    description: 'Complete range of hand and power tools for education, hospitality, medical, mining, and construction.',
    icon: 'wrench',
    image: handToolsImg,
    features: ['Grinders', 'Drills', 'Industrial grade']
  },
  {
    id: 6,
    title: 'Electrical Supplies',
    slug: 'electrical',
    description: 'Wide range of electrical supplies including transformers and minisubs for contractors and electricians.',
    icon: 'zap',
    image: electricalImg,
    features: ['Transformers', 'Minisubs', 'Lighting solutions']
  },
  {
    id: 7,
    title: 'Mechanical Engineering',
    slug: 'mechanical',
    description: 'Spanners, sockets, valves, fittings, couplings, shafts, flanges, bearings, welding machines.',
    icon: 'cog',
    image: mechanicalImg,
    features: ['Pumps & valves', 'Bearings', 'Welding equipment']
  },
  {
    id: 8,
    title: 'PPE Products',
    slug: 'ppe',
    description: 'Personal Protective Equipment for mining, construction, and industrial applications.',
    icon: 'hard-hat',
    image: ppeImg,
    features: ['Hard hats', 'Safety boots', 'Protective gear']
  }
]

export default products
