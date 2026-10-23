import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, KeyRound, Link2, Link2Off, UserCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@dep/ui/button";
import { FormField, Input } from "@dep/ui/form";
import { Section } from "@dep/ui/card";
import { confirm } from "@dep/ui/confirm";
import { notify } from "@dep/notify";
import { ApiError } from "@dep/axios";
import { useAuth } from "@/hooks/useAuth";
import { AvatarUploader } from "@/components/common/AvatarUploader";
import { hasPassword as userHasPassword, isGoogleLinked } from "@/types/user";
import * as authService from "@/services/auth.service";
import { GoogleAuthCancelled } from "@/services/auth.service";

const profileSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(50),
  avatarUrl: z
    .string()
    .max(14_000_000, "Ukuran gambar terlalu besar")
    .optional()
    .or(z.literal("")),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Wajib diisi"),
    newPassword: z.string().min(8, "Minimal 8 karakter"),
    confirmPassword: z.string().min(1, "Ulangi kata sandi baru"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi tidak cocok",
  });

const setPasswordSchema = z
  .object({
    newPassword: z.string().min(8, "Minimal 8 karakter"),
    confirmPassword: z.string().min(1, "Ulangi kata sandi"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi tidak cocok",
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;
type SetPasswordFormData = z.infer<typeof setPasswordSchema>;

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, updateProfile, refresh } = useAuth();
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingSetPassword, setSavingSetPassword] = useState(false);
  const [linkingGoogle, setLinkingGoogle] = useState(false);
  const [unlinkingGoogle, setUnlinkingGoogle] = useState(false);

  const hasPassword = userHasPassword(user);
  const googleLinked = isGoogleLinked(user);

  const setPasswordForm = useForm<SetPasswordFormData>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: {
      name: user?.name ?? "",
      avatarUrl: user?.avatarUrl ?? "",
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const submitProfile = profileForm.handleSubmit(async (data) => {
    setSavingProfile(true);
    try {
      await notify.promise(
        (async () => {
          // Avatar: kirim sebagai FILE (bukan base64 ke DB).
          const v = data.avatarUrl ?? "";
          if (v.startsWith("data:")) {
            // hasil crop AvatarUploader (data URL) → Blob → upload multipart.
            const blob = await (await fetch(v)).blob();
            await authService.uploadAvatar(blob);
          } else if (v === "" && user?.avatarUrl) {
            await authService.removeAvatar();
          }
          // Nama (sekaligus me-refresh context user dengan avatarUrl terbaru).
          await updateProfile({ name: data.name });
        })(),
        {
          loading: "Menyimpan profil…",
          success: "Profil diperbarui ✓",
          error: (e) => (e instanceof ApiError ? e.message : "Gagal menyimpan."),
        },
      );
    } catch {
      // surfaced via notify
    } finally {
      setSavingProfile(false);
    }
  });

  const submitPassword = passwordForm.handleSubmit(async (data) => {
    setSavingPassword(true);
    try {
      await notify.promise(
        authService.changePassword({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
        {
          loading: "Mengubah kata sandi…",
          success: "Kata sandi diubah ✓",
          error: (e) => (e instanceof ApiError ? e.message : "Gagal mengubah."),
        },
      );
      passwordForm.reset();
    } catch {
      // surfaced via notify
    } finally {
      setSavingPassword(false);
    }
  });

  const submitSetPassword = setPasswordForm.handleSubmit(async (data) => {
    setSavingSetPassword(true);
    try {
      await notify.promise(authService.setPassword(data.newPassword), {
        loading: "Menyimpan kata sandi…",
        success: "Kata sandi dibuat ✓",
        error: (e) => (e instanceof ApiError ? e.message : "Gagal menyimpan."),
      });
      setPasswordForm.reset();
      await refresh(); // authProviders kini memuat "password" → tampilkan form ubah
    } catch {
      // surfaced via notify
    } finally {
      setSavingSetPassword(false);
    }
  });

  const onLinkGoogle = async () => {
    setLinkingGoogle(true);
    try {
      await authService.linkGoogleAccount();
      await refresh(); // user kini ber-googleId
      notify.success("Akun Google berhasil ditautkan ✓");
    } catch (e) {
      if (e instanceof GoogleAuthCancelled) return; // user batal — bukan error
      notify.error(e instanceof ApiError ? e.message : (e as Error).message);
    } finally {
      setLinkingGoogle(false);
    }
  };

  const onUnlinkGoogle = async () => {
    const ok = await confirm({
      title: "Putuskan akun Google?",
      message: hasPassword
        ? "Anda tidak lagi bisa masuk dengan Google. Bisa ditautkan kembali kapan saja."
        : "Akun ini belum punya kata sandi. Buat kata sandi dulu sebelum melepas Google agar tidak terkunci.",
      confirmLabel: "Putuskan",
      cancelLabel: "Batal",
    });
    if (!ok) return;
    setUnlinkingGoogle(true);
    try {
      await authService.unlinkGoogleAccount();
      await refresh(); // user kini tanpa googleId
      notify.success("Tautan akun Google diputus ✓");
    } catch (e) {
      notify.error(e instanceof ApiError ? e.message : (e as Error).message);
    } finally {
      setUnlinkingGoogle(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-4 pb-20 sm:p-6">
      <button
        type="button"
        onClick={() => navigate("/dashboard/settings")}
        className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900"
      >
        <ArrowLeft size={16} /> Pengaturan
      </button>

      <header>
        <h1 className="text-2xl font-semibold text-neutral-900">Profil</h1>
        <p className="text-sm text-neutral-500">Atur nama dan keamanan akun Anda.</p>
      </header>

      <Section title="Informasi Profil" icon={<UserCircle2 size={16} />}>
        <form onSubmit={submitProfile} className="space-y-4 p-3" noValidate>
          <FormField
            label="Nama Lengkap"
            required
            errorMessage={profileForm.formState.errors.name?.message}
          >
            <Input {...profileForm.register("name")} />
          </FormField>

          <FormField
            label="Foto Profil"
            helperText="Unggah gambar (maks 10 MB), atur posisi & zoom, lalu klik Gunakan."
            errorMessage={profileForm.formState.errors.avatarUrl?.message}
          >
            <Controller
              control={profileForm.control}
              name="avatarUrl"
              render={({ field }) => (
                <AvatarUploader
                  value={field.value || undefined}
                  onChange={(v) => field.onChange(v ?? "")}
                />
              )}
            />
          </FormField>

          <div className="flex justify-end">
            <Button type="submit" isLoading={savingProfile}>
              Simpan Profil
            </Button>
          </div>
        </form>
      </Section>

      <Section title="Akun Tertaut" icon={<Link2 size={16} />}>
        <div className="flex items-center justify-between gap-3 p-3">
          <div>
            <p className="font-medium text-neutral-900">Google</p>
            <p className="text-sm text-neutral-500">
              {googleLinked
                ? "Akun Anda tertaut — bisa masuk dengan Google."
                : "Tautkan agar bisa masuk dengan Google & memakai backup Google Drive."}
            </p>
          </div>
          {googleLinked ? (
            <div className="flex shrink-0 items-center gap-2">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                Tertaut ✓
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<Link2Off size={14} />}
                isLoading={unlinkingGoogle}
                onClick={onUnlinkGoogle}
              >
                Putuskan
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="secondary"
              isLoading={linkingGoogle}
              onClick={onLinkGoogle}
            >
              Hubungkan
            </Button>
          )}
        </div>
      </Section>

      <Section title="Keamanan" icon={<KeyRound size={16} />}>
        {hasPassword ? (
          <form onSubmit={submitPassword} className="space-y-4 p-3" noValidate>
            <FormField
              label="Kata Sandi Sekarang"
              required
              errorMessage={passwordForm.formState.errors.currentPassword?.message}
            >
              <Input type="password" {...passwordForm.register("currentPassword")} />
            </FormField>
            <FormField
              label="Kata Sandi Baru"
              required
              errorMessage={passwordForm.formState.errors.newPassword?.message}
            >
              <Input type="password" {...passwordForm.register("newPassword")} />
            </FormField>
            <FormField
              label="Ulangi Kata Sandi Baru"
              required
              errorMessage={passwordForm.formState.errors.confirmPassword?.message}
            >
              <Input type="password" {...passwordForm.register("confirmPassword")} />
            </FormField>

            <div className="flex justify-end">
              <Button type="submit" isLoading={savingPassword}>
                Ubah Kata Sandi
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={submitSetPassword} className="space-y-4 p-3" noValidate>
            <p className="text-sm text-neutral-500">
              Akun ini masuk dengan Google dan belum memiliki kata sandi. Buat kata sandi
              agar bisa juga login dengan email &amp; kata sandi.
            </p>
            <FormField
              label="Kata Sandi Baru"
              required
              errorMessage={setPasswordForm.formState.errors.newPassword?.message}
            >
              <Input type="password" {...setPasswordForm.register("newPassword")} />
            </FormField>
            <FormField
              label="Ulangi Kata Sandi Baru"
              required
              errorMessage={setPasswordForm.formState.errors.confirmPassword?.message}
            >
              <Input type="password" {...setPasswordForm.register("confirmPassword")} />
            </FormField>

            <div className="flex justify-end">
              <Button type="submit" isLoading={savingSetPassword}>
                Buat Kata Sandi
              </Button>
            </div>
          </form>
        )}
      </Section>
    </div>
  );
};

export default ProfilePage;
