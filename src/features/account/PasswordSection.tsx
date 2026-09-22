import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useUpdatePassword } from "@/features/account/hooks"
import {
  passwordChangeSchema,
  type PasswordChangeFormValues,
} from "@/features/account/schemas"
import { toApiError } from "@/lib/http-client"

const EMPTY_VALUES: PasswordChangeFormValues = {
  current_password: "",
  password: "",
  password_confirmation: "",
}

export function PasswordSection() {
  const updatePassword = useUpdatePassword()

  const form = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: EMPTY_VALUES,
  })

  async function onSubmit(values: PasswordChangeFormValues) {
    try {
      await updatePassword.mutateAsync(values)
      toast.success("Mot de passe changé.")
      form.reset(EMPTY_VALUES)
    } catch (error) {
      const apiError = toApiError(error)
      if (apiError.errors) {
        for (const [field, messages] of Object.entries(apiError.errors)) {
          form.setError(field as keyof PasswordChangeFormValues, {
            message: messages[0],
          })
        }
      } else {
        form.setError("root", { message: apiError.message })
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Mot de passe</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="current_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mot de passe actuel</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="current-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nouveau mot de passe</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormDescription>
                    15 caractères minimum, sans contrainte de casse ou de chiffre.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password_confirmation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmer le mot de passe</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
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
            <div>
              <Button type="submit" disabled={updatePassword.isPending}>
                {updatePassword.isPending ? "Enregistrement..." : "Changer le mot de passe"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
