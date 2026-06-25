import { useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import clsx from 'clsx'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { WishlistSchema, type WishlistInput } from '../schemas/wishlist'
import { api } from '../services/api'

type WishlistFormValues = z.input<typeof WishlistSchema>

interface WishlistItem {
  name: string
  url?: string
  priority?: number
}

interface WishlistData {
  items: WishlistItem[]
}

interface Props {
  roomId: string
}

export default function WishlistEditor({ roomId }: Props) {
  const qc = useQueryClient()
  const queryKey = ['rooms', roomId, 'wishlist', 'me']

  const { data: serverData, isLoading } = useQuery({
    queryKey,
    queryFn: () => api.get<WishlistData>(`/api/rooms/${roomId}/wishlist/me`),
    retry: (failureCount, err: unknown) => {
      if (err instanceof Error && 'status' in err && (err as { status: number }).status === 404) return false
      return failureCount < 3
    },
    throwOnError: false,
  })

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<WishlistFormValues, unknown, WishlistInput>({
    resolver: zodResolver(WishlistSchema),
    defaultValues: { items: [{ name: '', url: '', priority: undefined }] },
    mode: 'onBlur',
  })

  useEffect(() => {
    if (serverData?.items?.length) {
      reset({
        items: serverData.items.map((item) => ({
          name: item.name,
          url: item.url ?? '',
          priority: item.priority,
        })),
      })
    }
  }, [serverData, reset])

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  const saveMutation = useMutation({
    mutationFn: (data: WishlistInput) =>
      api.post<WishlistData>(`/api/rooms/${roomId}/wishlist`, { items: data.items }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey })
    },
    onError: (err) => {
      setError('root.serverError', {
        message: err instanceof Error ? err.message : 'Failed to save wishlist',
      })
    },
  })

  const removeMutation = useMutation({
    mutationFn: (filtered: WishlistItem[]) =>
      api.post<WishlistData>(`/api/rooms/${roomId}/wishlist`, { items: filtered }),
    onMutate: async (filtered: WishlistItem[]) => {
      await qc.cancelQueries({ queryKey })
      const snapshot = qc.getQueryData<WishlistData>(queryKey)
      qc.setQueryData<WishlistData>(queryKey, { items: filtered })
      return { snapshot }
    },
    onError: (_err, _filtered, ctx) => {
      qc.setQueryData(queryKey, ctx?.snapshot)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey })
    },
  })

  const handleRemove = (idx: number) => {
    const current = qc.getQueryData<WishlistData>(queryKey)
    const filtered = (current?.items ?? []).filter((_, i) => i !== idx)
    remove(idx)
    removeMutation.mutate(filtered)
  }

  const submit = (data: WishlistInput) => {
    saveMutation.mutate(data)
  }

  if (isLoading) return <p className="text-sm text-gray-500">Loading wishlist…</p>

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-6">
      {errors.root?.serverError && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
          {errors.root.serverError.message}
        </p>
      )}

      <div className="space-y-4">
        {fields.map((field, idx) => (
          <div
            key={field.id}
            className="rounded-lg border border-gray-200 p-4 space-y-3"
          >
            <div className="flex flex-col gap-1">
              <label htmlFor={`items.${idx}.name`} className="text-sm font-medium text-gray-700">
                Item Name *
              </label>
              <input
                id={`items.${idx}.name`}
                type="text"
                placeholder="e.g., Drone 7 inch"
                aria-invalid={!!errors.items?.[idx]?.name}
                aria-describedby={errors.items?.[idx]?.name ? `items.${idx}.name-error` : undefined}
                className="focus-visible:ring-brand rounded border border-gray-300 px-3 py-2 text-sm outline-none focus-visible:ring-2"
                {...register(`items.${idx}.name`)}
              />
              {errors.items?.[idx]?.name && (
                <p id={`items.${idx}.name-error`} className="text-xs text-red-500" role="alert">
                  {errors.items[idx]?.name?.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor={`items.${idx}.url`} className="text-sm font-medium text-gray-700">
                URL (optional)
              </label>
              <input
                id={`items.${idx}.url`}
                type="text"
                placeholder="https://example.com/product"
                aria-invalid={!!errors.items?.[idx]?.url}
                aria-describedby={errors.items?.[idx]?.url ? `items.${idx}.url-error` : undefined}
                className="focus-visible:ring-brand rounded border border-gray-300 px-3 py-2 text-sm outline-none focus-visible:ring-2"
                {...register(`items.${idx}.url`)}
              />
              {errors.items?.[idx]?.url && (
                <p id={`items.${idx}.url-error`} className="text-xs text-red-500" role="alert">
                  {errors.items[idx]?.url?.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor={`items.${idx}.priority`} className="text-sm font-medium text-gray-700">
                Priority (1-5, optional)
              </label>
              <input
                id={`items.${idx}.priority`}
                type="number"
                placeholder="3"
                min="1"
                max="5"
                aria-invalid={!!errors.items?.[idx]?.priority}
                aria-describedby={errors.items?.[idx]?.priority ? `items.${idx}.priority-error` : undefined}
                className="focus-visible:ring-brand rounded border border-gray-300 px-3 py-2 text-sm outline-none focus-visible:ring-2"
                {...register(`items.${idx}.priority`)}
              />
              {errors.items?.[idx]?.priority && (
                <p id={`items.${idx}.priority-error`} className="text-xs text-red-500" role="alert">
                  {errors.items[idx]?.priority?.message}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => handleRemove(idx)}
              disabled={fields.length === 1}
              className={clsx(
                'text-sm font-medium px-3 py-1 rounded',
                fields.length === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-red-600 hover:bg-red-50',
              )}
            >
              Remove item
            </button>
          </div>
        ))}
      </div>

      {errors.items && typeof errors.items.message === 'string' && (
        <p className="text-sm text-red-600" role="alert">
          {errors.items.message}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => append({ name: '', url: '', priority: undefined })}
          className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
        >
          + Add item
        </button>
        <button
          type="submit"
          disabled={isSubmitting || saveMutation.isPending}
          className={clsx(
            'px-4 py-2 text-sm font-medium text-white bg-brand rounded hover:bg-brand-dark',
            (isSubmitting || saveMutation.isPending) && 'opacity-50 cursor-not-allowed',
          )}
        >
          {saveMutation.isPending ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}
