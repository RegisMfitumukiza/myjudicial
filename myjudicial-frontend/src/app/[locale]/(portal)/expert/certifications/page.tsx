"use client";

import { useState } from "react";
import { Plus, Award, Loader2, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useCertifications,
  useCreateCertification,
  useUpdateCertification,
  useDeleteCertification,
  type ExpertCertification,
  type CreateCertificationDto,
} from "@/features/experts/hooks/useCertifications";

const certificationSchema = z.object({
  certificateName: z.string().min(2).max(200),
  issuer: z.string().min(2).max(200),
  issueDate: z.string().min(1, "Issue date is required"),
  expiryDate: z.string().optional(),
});

type CertificationFormValues = z.infer<typeof certificationSchema>;

export default function CertificationsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingCert, setEditingCert] = useState<ExpertCertification | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: certifications, isLoading, error } = useCertifications();
  const createCertification = useCreateCertification();
  const updateCertification = useUpdateCertification();
  const deleteCertification = useDeleteCertification();

  const form = useForm<CertificationFormValues>({
    resolver: zodResolver(certificationSchema),
    defaultValues: {
      certificateName: "",
      issuer: "",
      issueDate: "",
      expiryDate: "",
    },
  });

  const handleEdit = (cert: ExpertCertification) => {
    setEditingCert(cert);
    form.reset({
      certificateName: cert.certificateName,
      issuer: cert.issuer,
      issueDate: cert.issueDate.slice(0, 10),
      expiryDate: cert.expiryDate?.slice(0, 10) || "",
    });
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingCert(undefined);
    form.reset();
  };

  const onSubmit = async (values: CertificationFormValues) => {
    const dto: CreateCertificationDto = {
      certificateName: values.certificateName,
      issuer: values.issuer,
      issueDate: values.issueDate,
      expiryDate: values.expiryDate,
    };

    try {
      if (editingCert) {
        await updateCertification.mutateAsync({ id: editingCert.id, dto });
      } else {
        await createCertification.mutateAsync(dto);
      }
      handleClose();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteCertification.mutateAsync(deletingId);
      setDeletingId(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isSaving = createCertification.isPending || updateCertification.isPending;

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Certifications</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage your professional certifications and credentials
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Certification
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>Failed to load certifications.</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
        </div>
      )}

      {!isLoading && !error && certifications?.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-brand-border bg-white p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-blue/10">
            <Award className="h-8 w-8 text-brand-blue" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-brand-dark">
            No certifications yet
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Add your professional certifications and credentials.
          </p>
          <Button onClick={() => setShowForm(true)} className="mt-6">
            <Plus className="mr-2 h-4 w-4" />
            Add Certification
          </Button>
        </div>
      )}

      {!isLoading && !error && certifications && certifications.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {certifications.map((cert) => (
            <div
              key={cert.id}
              className="rounded-lg border border-brand-border bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-brand-blue" />
                    <h3 className="font-semibold text-brand-dark">
                      {cert.certificateName}
                    </h3>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{cert.issuer}</p>
                  <div className="mt-3 space-y-1 text-xs text-slate-500">
                    <p>Issued: {format(new Date(cert.issueDate), "MMM yyyy")}</p>
                    {cert.expiryDate && (
                      <p>Expires: {format(new Date(cert.expiryDate), "MMM yyyy")}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(cert)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeletingId(cert.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCert ? "Edit Certification" : "Add Certification"}
            </DialogTitle>
            <DialogDescription>
              {editingCert
                ? "Update your certification details"
                : "Add a professional certification"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Field>
              <FieldLabel htmlFor="certificateName">Certificate Name</FieldLabel>
              <FieldContent>
                <Input
                  id="certificateName"
                  placeholder="e.g., Bar Admission Certificate"
                  {...form.register("certificateName")}
                />
              </FieldContent>
              <FieldError>
                {form.formState.errors.certificateName?.message}
              </FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="issuer">Issuing Organization</FieldLabel>
              <FieldContent>
                <Input
                  id="issuer"
                  placeholder="e.g., Rwanda Bar Association"
                  {...form.register("issuer")}
                />
              </FieldContent>
              <FieldError>{form.formState.errors.issuer?.message}</FieldError>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="issueDate">Issue Date</FieldLabel>
                <FieldContent>
                  <Input
                    id="issueDate"
                    type="date"
                    {...form.register("issueDate")}
                  />
                </FieldContent>
                <FieldError>
                  {form.formState.errors.issueDate?.message}
                </FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="expiryDate">Expiry Date (Optional)</FieldLabel>
                <FieldContent>
                  <Input
                    id="expiryDate"
                    type="date"
                    {...form.register("expiryDate")}
                  />
                </FieldContent>
                <FieldError>
                  {form.formState.errors.expiryDate?.message}
                </FieldError>
              </Field>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingCert ? "Update" : "Add"} Certification
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deletingId !== null}
        onOpenChange={(open) => !open && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Certification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this certification? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteCertification.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteCertification.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
