import { Star } from 'lucide-react'

interface StarRatingProps {
  rating: number
  size?: number
  className?: string
}

export default function StarRating({ rating = 5, size = 14, className = '' }: StarRatingProps) {
  const stars = Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      size={size}
      className={`${i < Math.round(rating) ? 'text-amber-500 fill-amber-500' : 'text-gray-300 fill-none'} transition-colors`}
    />
  ))

  return <div className={`flex items-center gap-1 ${className}`}>{stars}</div>
}
