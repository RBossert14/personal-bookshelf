"use client";

import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SHELF_LABELS, SHELF_STATUSES, type BookInput, type ShelfStatus } from "@/lib/books/types";

import { BookCover } from "./book-cover";
import { DatePicker } from "./date-picker";
import { StarRatingInput } from "./star-rating";

export type BookFormValues = Omit<BookInput, "year" | "pages"> & { year: string; pages: string };

export function toFormValues(book: Partial<BookInput>): BookFormValues {
  return {
    title: book.title ?? "",
    author: book.author ?? "",
    status: book.status ?? "want",
    year: book.year?.toString() ?? "",
    pages: book.pages?.toString() ?? "",
    genre: book.genre ?? "",
    coverUrl: book.coverUrl ?? "",
    spineColor: book.spineColor,
    rating: book.rating,
    notes: book.notes ?? "",
    startedAt: book.startedAt,
    finishedAt: book.finishedAt,
    openLibraryKey: book.openLibraryKey,
  };
}

function toInput(values: BookFormValues): BookInput {
  const number = (text: string) => (text.trim() ? Number(text) : undefined);
  const text = (value?: string) => value?.trim() || undefined;
  return {
    ...values,
    title: values.title.trim(),
    author: values.author.trim(),
    year: number(values.year),
    pages: number(values.pages),
    genre: text(values.genre),
    coverUrl: text(values.coverUrl),
    notes: text(values.notes),
    // Unread books don't have a finish date or rating.
    finishedAt: values.status === "read" ? values.finishedAt : undefined,
    rating: values.status === "want" ? undefined : values.rating,
  };
}

type Errors = Partial<Record<"title" | "author" | "year" | "pages" | "finishedAt", string>>;

function validate(values: BookFormValues): Errors {
  const errors: Errors = {};
  if (!values.title.trim()) errors.title = "Enter the book's title.";
  if (!values.author.trim()) errors.author = "Enter the author's name.";
  if (values.year && !/^-?\d{1,4}$/.test(values.year.trim())) errors.year = "Use a year like 1937.";
  if (values.pages && !(Number(values.pages) > 0)) errors.pages = "Use a whole number of pages.";
  if (values.startedAt && values.finishedAt && values.finishedAt < values.startedAt) {
    errors.finishedAt = "The finish date is before the start date.";
  }
  return errors;
}

interface BookFormProps {
  initial: BookFormValues;
  genres: string[];
  submitLabel: string;
  onSubmit: (input: BookInput) => Promise<void> | void;
  onCancel: () => void;
  cancelLabel?: string;
}

export function BookForm({ initial, genres, submitLabel, onSubmit, onCancel, cancelLabel = "Cancel" }: BookFormProps) {
  const id = useId();
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof BookFormValues>(key: K, value: BookFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (key in errors) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    const firstInvalid = Object.keys(found).find((k) => found[k as keyof Errors]);
    if (firstInvalid) {
      document.getElementById(`${id}-${firstInvalid}`)?.focus();
      return;
    }
    setSaving(true);
    try {
      await onSubmit(toInput(values));
    } finally {
      setSaving(false);
    }
  };

  const field = (name: keyof Errors) => ({
    id: `${id}-${name}`,
    "aria-invalid": errors[name] ? true : undefined,
  });

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <div className="flex gap-4">
        <BookCover
          book={{ title: values.title || "Untitled", author: values.author, coverUrl: values.coverUrl || undefined, spineColor: values.spineColor }}
          className="w-20 flex-none self-start sm:w-24"
        />
        <FieldGroup className="gap-4">
          <Field data-invalid={!!errors.title}>
            <FieldLabel htmlFor={`${id}-title`}>Title</FieldLabel>
            <Input {...field("title")} value={values.title} onChange={(e) => set("title", e.target.value)} />
            <FieldError>{errors.title}</FieldError>
          </Field>
          <Field data-invalid={!!errors.author}>
            <FieldLabel htmlFor={`${id}-author`}>Author</FieldLabel>
            <Input {...field("author")} value={values.author} onChange={(e) => set("author", e.target.value)} />
            <FieldError>{errors.author}</FieldError>
          </Field>
        </FieldGroup>
      </div>

      <FieldGroup className="grid gap-4 sm:grid-cols-3">
        <Field data-invalid={!!errors.year}>
          <FieldLabel htmlFor={`${id}-year`}>Year published</FieldLabel>
          <Input {...field("year")} inputMode="numeric" value={values.year} onChange={(e) => set("year", e.target.value)} />
          <FieldError>{errors.year}</FieldError>
        </Field>
        <Field data-invalid={!!errors.pages}>
          <FieldLabel htmlFor={`${id}-pages`}>Pages</FieldLabel>
          <Input {...field("pages")} inputMode="numeric" value={values.pages} onChange={(e) => set("pages", e.target.value)} />
          <FieldError>{errors.pages}</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor={`${id}-genre`}>Genre</FieldLabel>
          <Input
            id={`${id}-genre`}
            list={`${id}-genres`}
            value={values.genre}
            onChange={(e) => set("genre", e.target.value)}
          />
          <datalist id={`${id}-genres`}>
            {genres.map((genre) => (
              <option key={genre} value={genre} />
            ))}
          </datalist>
        </Field>
      </FieldGroup>

      <FieldGroup className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor={`${id}-status`}>Shelf</FieldLabel>
          <Select value={values.status} onValueChange={(v) => set("status", v as ShelfStatus)}>
            <SelectTrigger id={`${id}-status`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SHELF_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {SHELF_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        {values.status !== "want" && (
          <Field>
            <FieldLabel id={`${id}-rating-label`}>My rating</FieldLabel>
            <StarRatingInput
              aria-labelledby={`${id}-rating-label`}
              value={values.rating}
              onChange={(rating) => set("rating", rating)}
            />
          </Field>
        )}
      </FieldGroup>

      {values.status !== "want" && (
        <FieldGroup className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor={`${id}-startedAt`}>Started</FieldLabel>
            <DatePicker id={`${id}-startedAt`} value={values.startedAt} onChange={(d) => set("startedAt", d)} />
          </Field>
          {values.status === "read" && (
            <Field data-invalid={!!errors.finishedAt}>
              <FieldLabel htmlFor={`${id}-finishedAt`}>Finished</FieldLabel>
              <DatePicker
                id={`${id}-finishedAt`}
                value={values.finishedAt}
                onChange={(d) => set("finishedAt", d)}
                aria-invalid={!!errors.finishedAt}
              />
              <FieldError>{errors.finishedAt}</FieldError>
            </Field>
          )}
        </FieldGroup>
      )}

      <Field>
        <FieldLabel htmlFor={`${id}-notes`}>Notes</FieldLabel>
        <Textarea
          id={`${id}-notes`}
          rows={4}
          value={values.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="What stayed with you?"
        />
      </Field>

      <Field>
        <FieldLabel htmlFor={`${id}-cover`}>Cover image URL</FieldLabel>
        <Input
          id={`${id}-cover`}
          type="url"
          value={values.coverUrl}
          onChange={(e) => {
            set("coverUrl", e.target.value);
            set("spineColor", undefined); // re-extract from the new cover
          }}
        />
        <FieldDescription>Filled in automatically when you pick a book from Open Library.</FieldDescription>
      </Field>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button type="submit" disabled={saving}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
