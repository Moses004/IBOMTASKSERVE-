import {
  Sparkles,
  Wrench,
  Zap,
  Hammer,
  Truck,
  Package,
  Leaf,
  PaintBucket,
  Scissors,
  Ruler,
  type LucideIcon,
} from 'lucide-react'

interface CategoryStyle {
  icon: LucideIcon
  bg: string
  fg: string
}

const styleMap: Record<string, CategoryStyle> = {
  cleaning: { icon: Sparkles, bg: 'bg-[#E3F1FF]', fg: 'text-primary' },
  plumbing: { icon: Wrench, bg: 'bg-[#E3F1FF]', fg: 'text-[#0FA0CE]' },
  electrician: { icon: Zap, bg: 'bg-[#FFF4D9]', fg: 'text-[#E0A100]' },
  handyman: { icon: Hammer, bg: 'bg-[#FDE3EE]', fg: 'text-[#E0559A]' },
  'moving-help': { icon: Truck, bg: 'bg-[#E3F1FF]', fg: 'text-primary' },
  assembly: { icon: Package, bg: 'bg-[#FFF4D9]', fg: 'text-[#E0A100]' },
  'yard-care': { icon: Leaf, bg: 'bg-success-soft', fg: 'text-success' },
  painting: { icon: PaintBucket, bg: 'bg-[#FDE3EE]', fg: 'text-[#E0559A]' },
  'hair-beauty': { icon: Scissors, bg: 'bg-[#FDE3EE]', fg: 'text-[#E0559A]' },
  carpentry: { icon: Ruler, bg: 'bg-[#E3F1FF]', fg: 'text-[#0FA0CE]' },
}

const fallback: CategoryStyle = { icon: Package, bg: 'bg-primary-soft', fg: 'text-primary' }

export function getCategoryStyle(slug: string): CategoryStyle {
  return styleMap[slug] ?? fallback
}
