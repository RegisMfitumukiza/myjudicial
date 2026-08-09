declare module "recharts" {
  import * as React from "react";

  export type TooltipValueType = unknown;
  export type TooltipNameType = number | string;

  export type DefaultTooltipContentProps<T = any, K = any> = React.HTMLAttributes<HTMLDivElement> & {
    active?: boolean;
    payload?: Array<{
      dataKey?: string | number;
      name?: string;
      value?: T;
      payload?: K;
      type?: string;
      color?: string;
    }>;
    label?: string | number;
  };

  export type DefaultLegendContentProps = React.HTMLAttributes<HTMLDivElement> & {
    payload?: Array<{
      dataKey?: string | number;
      value?: string;
      color?: string;
      type?: string;
    }>;
  };

  export const ResponsiveContainer: React.ComponentType<any>;
  export const Tooltip: React.ComponentType<any>;
  export const Legend: React.ComponentType<any>;
  export const AreaChart: React.ComponentType<any>;
  export const Area: React.ComponentType<any>;
  export const XAxis: React.ComponentType<any>;
  export const YAxis: React.ComponentType<any>;
  export const CartesianGrid: React.ComponentType<any>;
  export const BarChart: React.ComponentType<any>;
  export const Bar: React.ComponentType<any>;
  export const LineChart: React.ComponentType<any>;
  export const Line: React.ComponentType<any>;
  export const PieChart: React.ComponentType<any>;
  export const Pie: React.ComponentType<any>;
  export const Cell: React.ComponentType<any>;
  export const Sector: React.ComponentType<any>;
}
