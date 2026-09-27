import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { PasswordInput } from "@/components/PasswordInput"
import { useDeleteAccount } from "@/features/account/hooks"
import {
  deleteAccountSchema,
  type DeleteAccountFormValues,
} from "@/features/account/schemas"
import { toApiError } from "@/lib/http-client"
import { useAuth } from "@/providers/AuthProvider"

export function DangerZoneSection() {
  const [open, setOpen] = useState(false)
  const deleteAccount = useDeleteAccount()
  const { endSession } = useAuth()
  const navigate = useNavigate()

  const form = useForm<DeleteAccountFormValues>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: { password: "" },
  })

  async function onSubmit(values: DeleteAccountFormValues) {
    try {
      await deleteAccount.mutateAsync(values.password)
      // Same cleanup as a normal logout (AuthProvider.logout) - the
      // session is invalidated server-side by the delete, and every
      // cached response (portfolio, alerts, ...) belonged to an account
      // that no longer exists.
      endSession()
      navigate("/login", { replace: true })
    } catch (error) {
      const apiError = toApiError(error)
      if (apiError.errors) {
        for (const [field, messages] of Object.entries(apiError.errors)) {
          form.setError(field as keyof DeleteAccountFormValues, {
            message: messages[0],
          })
        }
      } else {
        form.setError("root", { message: apiError.message })
      }
    }
  }

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="text-destructive text-sm">Zone dangereuse</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-muted-foreground max-w-sm text-sm">
          Supprime définitivement ton compte, ton portefeuille et tes alertes.
          Cette action est irréversible.
        </p>
        <Button type="button" variant="destructive" onClick={() => setOpen(true)}>
          Supprimer le compte
        </Button>
      </CardContent>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) form.reset({ password: "" })
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le compte ?</DialogTitle>
            <DialogDescription>
              Ton portefeuille et tes alertes seront supprimés. Ton historique
              d'audit est conservé, anonymisé. Confirme avec ton mot de passe.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mot de passe</FormLabel>
                    <FormControl>
                      <PasswordInput autoComplete="current-password" {...field} />
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
              <DialogFooter>
                <Button
                  type="submit"
                  className="bg-destructive text-white hover:bg-destructive/90"
                  disabled={deleteAccount.isPending}
                >
                  {deleteAccount.isPending ? "Suppression..." : "Supprimer définitivement"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
