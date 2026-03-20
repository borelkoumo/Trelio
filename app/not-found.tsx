import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-zinc-900 mb-4">404 - Page Not Found</h1>
      <p className="text-zinc-500 mb-8">The page you are looking for does not exist.</p>
      <Link href="/">
        <Button className="bg-zinc-900 text-white hover:bg-zinc-800">Return Home</Button>
      </Link>
    </div>
  )
}
