import { db } from "@/lib/db";
import { StatsCard } from "@/components/dynamic/stats-card";
import { ActivityFeedDynamic } from "@/components/dynamic/activity-feed-dynamic";
import { RecentEmployeesDynamic } from "@/components/dynamic/recent-employees-dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Component registry - маппинг ID компонента на реальный React компонент
export const COMPONENT_REGISTRY: Record<string, React.ComponentType<any>> = {
  StatsCard: StatsCard,
  ActivityFeed: ActivityFeedDynamic,
  RecentEmployees: RecentEmployeesDynamic,
  Card: ({ title, padding, children }: any) => {
    const paddingClass = padding === 'small' ? 'p-4' : padding === 'large' ? 'p-8' : 'p-6';
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className={paddingClass}>
          {children || <p className="text-slate-500">Card content</p>}
        </CardContent>
      </Card>
    );
  },
  GridContainer: ({ columns, gap, children }: any) => {
    const gapValue = gap === 'small' ? '12px' : gap === 'large' ? '32px' : '24px';
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: gapValue,
        }}
      >
        {children}
      </div>
    );
  },
};

interface PageConfig {
  sections: Array<{
    id: string;
    type: "grid";
    columns: number;
    gap: string;
    blocks: Array<{
      id: string;
      component: string;
      props: Record<string, any>;
    }>;
  }>;
}

export async function getPageConfig(page: string): Promise<PageConfig | null> {
  try {
    const pageConfig = await db.pageConfig.findUnique({
      where: { page },
    });

    if (!pageConfig) return null;

    return pageConfig.config as unknown as PageConfig;
  } catch (error) {
    console.error("Failed to load page config:", error);
    return null;
  }
}

export function renderPageConfig(config: PageConfig) {
  if (!config || !config.sections || config.sections.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {config.sections.map((section) => (
        <div
          key={section.id}
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${section.columns}, 1fr)`,
            gap: section.gap,
          }}
        >
          {section.blocks.map((block) => {
            const Component = COMPONENT_REGISTRY[block.component];
            
            if (!Component) {
              console.warn(`Component ${block.component} not found in registry`);
              return (
                <div key={block.id} className="p-4 border-2 border-dashed border-red-300 rounded-lg">
                  <p className="text-red-600 text-sm">Component not found: {block.component}</p>
                </div>
              );
            }

            return <Component key={block.id} {...block.props} />;
          })}
        </div>
      ))}
    </div>
  );
}
