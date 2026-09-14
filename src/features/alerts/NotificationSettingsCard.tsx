import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { useNotificationSettings, useUpdateNotificationSettings } from "@/features/alerts/hooks"
import {
  notificationSettingsSchema,
  type NotificationSettingsFormValues,
} from "@/features/alerts/schemas"
import { toApiError } from "@/lib/http-client"

export function NotificationSettingsCard() {
  const { data: settings, isLoading } = useNotificationSettings()
  const updateSettings = useUpdateNotificationSettings()

  const form = useForm<NotificationSettingsFormValues>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      email_notifications_enabled: true,
      discord_webhook_url: "",
      daily_digest_enabled: false,
      weekly_digest_enabled: false,
    },
  })

  useEffect(() => {
    if (settings) {
      form.reset({
        email_notifications_enabled: settings.email_notifications_enabled,
        discord_webhook_url: settings.discord_webhook_url ?? "",
        daily_digest_enabled: settings.daily_digest_enabled,
        weekly_digest_enabled: settings.weekly_digest_enabled,
      })
    }
  }, [settings, form])

  async function onSubmit(values: NotificationSettingsFormValues) {
    try {
      await updateSettings.mutateAsync({
        ...values,
        discord_webhook_url: values.discord_webhook_url || null,
      })
      toast.success("Préférences enregistrées")
    } catch (error) {
      form.setError("root", { message: toApiError(error).message })
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Notifications</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="email_notifications_enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between">
                  <FormLabel className="font-normal">Notifications par email</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="daily_digest_enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between">
                  <FormLabel className="font-normal">Résumé quotidien</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="weekly_digest_enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between">
                  <FormLabel className="font-normal">Résumé hebdomadaire</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="discord_webhook_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Webhook Discord (optionnel)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://discord.com/api/webhooks/..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.formState.errors.root && (
              <p className="text-destructive text-sm">
                {form.formState.errors.root.message}
              </p>
            )}
            <Button type="submit" disabled={updateSettings.isPending} className="w-fit">
              {updateSettings.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
