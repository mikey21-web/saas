import { ArrowUp, ArrowDown } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface MetricsProps {
  title: string
  value: string
  trend: string
}

export function Metrics({ title, value, trend }: MetricsProps) {
  const isPositive = trend.startsWith('+')
  return (
    <Card className="group hover:shadow-lg transition-all">
      <CardHeader className="pb-3">
        <CardTitle className="text-2xl font-bold text-gray-900">{value}</CardTitle>
        <CardDescription className="text-gray-600">{title}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-sm">
          {isPositive ? <ArrowUp className="w-4 h-4 text-green-600" /> : <ArrowDown className="w-4 h-4 text-red-600" />}
          <span className={isPositive ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
            {trend} from last month
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

