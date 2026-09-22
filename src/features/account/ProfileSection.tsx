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
import { PasswordInput } from "@/components/PasswordInput"
import { useUpdateProfile } from "@/features/account/hooks"
import { buildProfileSchema, type ProfileFormValues } from "@/features/account/schemas"
import { toApiError } from "@/lib/http-client"
import type { User } from "@/types/api"

export function ProfileSection({ user }: { user: User }) {
  const updateProfile = useUpdateProfile()

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(buildProfileSchema(user.email)),
    defaultValues: { name: user.name, email: user.email, current_password: "" },
  })

  const emailChanged = form.watch("email") !== user.email

  async function onSubmit(values: ProfileFormValues) {
    try {
      await updateProfile.mutateAsync({
        name: values.name,
        email: values.email,
        current_password: emailChanged ? values.current_password : undefined,
      })
      toast.success(
        emailChanged
          ? "Profil mis à jour — vérifie ta nouvelle adresse email."
          : "Profil mis à jour.",
      )
      form.reset({ name: values.name, email: values.email, current_password: "" })
    } catch (error) {
      const apiError = toApiError(error)
      if (apiError.errors) {
        for (const [field, messages] of Object.entries(apiError.errors)) {
          form.setError(field as keyof ProfileFormValues, { message: messages[0] })
        }
      } else {
        form.setError("root", { message: apiError.message })
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Profil</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input autoComplete="name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {emailChanged && (
              <FormField
                control={form.control}
                name="current_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mot de passe actuel</FormLabel>
                    <FormControl>
                      <PasswordInput autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormDescription>
                      Requis pour changer d'email. Ton compte redeviendra "non
                      vérifié" jusqu'au clic sur le lien envoyé à la nouvelle
                      adresse.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {form.formState.errors.root && (
              <p className="text-destructive text-sm">
                {form.formState.errors.root.message}
              </p>
            )}
            <div>
              <Button type="submit" disabled={updateProfile.isPending}>
                {updateProfile.isPending ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
