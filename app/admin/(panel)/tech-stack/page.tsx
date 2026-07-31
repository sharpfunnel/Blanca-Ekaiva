"use client";

import { useQuery } from "@tanstack/react-query";
import {
  MonitorSmartphone,
  Globe,
  Cpu,
  Monitor,
  Wifi,
  Languages,
} from "lucide-react";
import { getTechStack, queryKeys } from "@/lib/admin/api";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { Card, CardHeader } from "@/components/admin/ui/Card";
import { Skeleton } from "@/components/admin/ui/Skeleton";
import { DonutChart } from "@/components/admin/charts/DonutChart";
import { BarList } from "@/components/admin/charts/BarList";
import type { Distribution } from "@/lib/admin/types";

export default function TechStackPage() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.techStack(),
    queryFn: getTechStack,
  });

  const donut = (title: string, icon: React.ReactNode, items?: Distribution[]) => (
    <Card>
      <CardHeader title={<span className="flex items-center gap-2">{icon}{title}</span>} />
      <div className="px-5 pb-5">
        {isLoading || !items ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <DonutChart data={items} centerLabel="visitors" />
        )}
      </div>
    </Card>
  );

  const bars = (
    title: string,
    icon: React.ReactNode,
    items: Distribution[] | undefined,
    color: string
  ) => (
    <Card>
      <CardHeader title={<span className="flex items-center gap-2">{icon}{title}</span>} />
      <div className="px-4 pb-4">
        {isLoading || !items ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <BarList items={items.map((i) => ({ label: i.label, value: i.value }))} color={color} />
        )}
      </div>
    </Card>
  );

  return (
    <div>
      <PageHeader
        title="Tech Stack"
        subtitle="Devices, browsers and networks your visitors use"
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {donut("Device Type", <MonitorSmartphone className="size-4 text-admin-muted" />, data?.devices)}
        {donut("Browser", <Globe className="size-4 text-admin-muted" />, data?.browsers)}
        {donut("Operating System", <Cpu className="size-4 text-admin-muted" />, data?.os)}
        {bars("Screen Resolution", <Monitor className="size-4 text-admin-muted" />, data?.resolutions, "#c5a059")}
        {bars("Network", <Wifi className="size-4 text-admin-muted" />, data?.networks, "#34d399")}
        {bars("Language", <Languages className="size-4 text-admin-muted" />, data?.languages, "#a78bfa")}
      </div>
    </div>
  );
}
