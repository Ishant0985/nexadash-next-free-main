'use client'

import {
    PolarAngleAxis,
    PolarGrid,
    RadialBar,
    RadialBarChart,
    ResponsiveContainer,
} from 'recharts'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart'

const data = [
    {
        category: 'Category A',
        value: 65,
        fill: '#7C3AED',
    },
    {
        category: 'Category B',
        value: 85,
        fill: '#EAB308',
    },
    {
        category: 'Category C',
        value: 95,
        fill: '#64748B',
    },
    {
        category: 'Category D',
        value: 80,
        fill: '#38BDF8',
    },
    {
        category: 'Category E',
        value: 70,
        fill: '#E11D48',
    },
]

const colors = ['#7C3AED', '#EAB308', '#64748B', '#38BDF8', '#E11D48', '#10B981', '#F97316', '#2563EB'];

export function DistributionRadialStackedChart({
    className,
    isShowTitle = true,
    customData,
}: {
    className?: string
    isShowTitle?: boolean
    customData?: { category: string; value: number }[]
}) {
    // Transform custom data to match the expected format for the chart
    const transformedData = customData ? 
        customData.map((item, index) => ({
            category: item.category,
            value: item.value,
            fill: colors[index % colors.length],
        }))
        : data;

    return (
        <Card className={className || ''}>
            {isShowTitle && (
                <CardHeader className="pb-4">
                    <span className="text-base/5 font-semibold text-black">
                        Category Distribution
                    </span>
                </CardHeader>
            )}
            <CardContent className="h-[300px] w-full px-0 pb-0">
                <ChartContainer config={{ type: { label: 'radial' } }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                            innerRadius="30%"
                            outerRadius="100%"
                            barSize={10}
                            data={transformedData}
                            startAngle={90}
                            endAngle={-270}
                        >
                            <PolarGrid radialLines={false} />
                            <PolarAngleAxis
                                type="number"
                                domain={[0, 100]}
                                tick={false}
                                axisLine={false}
                            />
                            <ChartTooltip
                                content={
                                    <ChartTooltipContent
                                        className="rounded-md"
                                        formatter={(value, name) => [
                                            `${value}`,
                                            `${name}`,
                                        ]}
                                    />
                                }
                            />
                            <RadialBar
                                background
                                dataKey="value"
                                name="category"
                                cornerRadius={8}
                            />
                            <text
                                x="50%"
                                y="48%"
                                textAnchor="middle"
                                className="fill-black text-lg font-medium"
                            >
                                {transformedData.length} Categories
                            </text>
                        </RadialBarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
