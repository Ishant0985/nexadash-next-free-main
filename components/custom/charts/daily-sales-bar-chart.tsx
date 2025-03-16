'use client'

import {
    Bar,
    BarChart,
    LabelList,
    ResponsiveContainer,
    Tooltip,
    XAxis,
} from 'recharts'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart'

const chartData = [
    { day: 'Sun', value: 1450, pv: 1300 },
    { day: 'Mon', value: 1400, pv: 1200 },
    { day: 'Tue', value: 1800, pv: 900 },
    { day: 'Wed', value: 1100, pv: 1300 },
    { day: 'Thu', value: 1000, pv: 1400 },
    { day: 'Fri', value: 1300, pv: 1400 },
    { day: 'Sat', value: 2000, pv: 1600 },
]

const chartConfig = {
    value: {
        label: 'Value',
        color: 'hsl(var(--chart-1))',
    },
} satisfies ChartConfig

export function DailySalesBarChart({
    className,
    cardContentClassName,
    isShowTitle = true,
    customData,
}: {
    className?: string
    cardContentClassName?: string
    isShowTitle?: boolean
    customData?: { day: string; value: number }[]
}) {
    // Transform custom data to match the expected format for the chart
    const transformedData = customData?.map(item => ({
        ...item,
        pv: Math.round(item.value * 0.8) // Create a pv value for visualization
    })) || chartData;

    return (
        <Card className={className}>
            {isShowTitle && (
                <CardHeader className="pb-0 pt-4 pl-4">
                    <span className="text-base/5 font-semibold text-black">
                        Daily Sales
                    </span>
                </CardHeader>
            )}
            <CardContent
                className={`h-[212px] !px-0 !pb-0 pt-5 ${cardContentClassName}`}
            >
                <ChartContainer config={chartConfig} className="w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={transformedData}
                            layout="vertical"
                            margin={{
                                left: 20,
                                right: 20,
                                top: 6,
                                bottom: 6,
                            }}
                            barCategoryGap={8}
                            stackOffset="expand"
                            className="!mt-1"
                        >
                            <XAxis
                                type="number"
                                axisLine={false}
                                tickLine={false}
                                tick={false}
                                domain={[0, 'dataMax + 100']}
                                className="font-medium"
                                height={0}
                            />
                            <Tooltip
                                content={
                                    <ChartTooltipContent
                                        labelFormatter={(value) => `Day: ${value}`}
                                        formatter={(value) => `${Number(value).toLocaleString()}`}
                                    />
                                }
                            />
                            <Bar
                                dataKey="value"
                                name="Amount"
                                radius={4}
                                fill="hsl(var(--chart-1))"
                                barSize={10}
                                background={{
                                    radius: 4,
                                    fill: 'hsl(var(--gray-200))',
                                }}
                            >
                                <LabelList
                                    dataKey="day"
                                    position="insideLeft"
                                    style={{
                                        fontSize: 12,
                                        fill: 'hsl(var(--foreground))',
                                        fontWeight: 500,
                                    }}
                                    className="text-2xs"
                                />
                                <LabelList
                                    dataKey="value"
                                    position="insideRight"
                                    style={{
                                        fontSize: 12,
                                        fill: 'hsl(var(--foreground))',
                                        fontWeight: 500,
                                    }}
                                    formatter={(value: number) =>
                                        `$${value.toLocaleString()}`
                                    }
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
