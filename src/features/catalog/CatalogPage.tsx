import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AssetsTab } from "@/features/catalog/AssetsTab"
import { PlatformsTab } from "@/features/catalog/PlatformsTab"

export function CatalogPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">Catalogue</h1>

      <Tabs defaultValue="assets">
        <TabsList>
          <TabsTrigger value="assets">Actifs</TabsTrigger>
          <TabsTrigger value="platforms">Plateformes</TabsTrigger>
        </TabsList>
        <TabsContent value="assets">
          <AssetsTab />
        </TabsContent>
        <TabsContent value="platforms">
          <PlatformsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
