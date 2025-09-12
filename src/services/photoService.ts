import { supabase } from '@/lib/supabase'
import { GalleryImage } from '@/types/gallery'

export interface PhotoUpload {
  file: File
  title?: string
  description?: string
}

export interface PhotoRecord {
  id: string
  user_id: string
  title: string | null
  description: string | null
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  mood_detected: string | null
  mood_confidence: number | null
  ai_analysis: any
  created_at: string
  updated_at: string
}

export const photoService = {
  async uploadPhoto(photoUpload: PhotoUpload): Promise<{ data: GalleryImage | null; error: any }> {
    try {
      const { file, title, description } = photoUpload
      const user = supabase.auth.getUser()
      
      if (!user) {
        return { data: null, error: { message: 'User not authenticated' } }
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${(await user).data.user?.id}/${fileName}`

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, file)

      if (uploadError) {
        return { data: null, error: uploadError }
      }

      // Save photo record to database
      const { data: photoData, error: dbError } = await supabase
        .from('photos')
        .insert({
          title: title || file.name,
          description: description || null,
          file_name: fileName,
          file_path: uploadData.path,
          file_size: file.size,
          mime_type: file.type,
          user_id: (await user).data.user?.id
        })
        .select()
        .single()

      if (dbError) {
        // Clean up uploaded file if database insert fails
        await supabase.storage.from('photos').remove([filePath])
        return { data: null, error: dbError }
      }

      // Get signed URL for the uploaded image (works with private buckets)
      const { data: urlData, error: urlError } = await supabase.storage
        .from('photos')
        .createSignedUrl(uploadData.path, 60 * 60 * 24 * 365) // 1 year expiry

      if (urlError) {
        console.error('Error creating signed URL:', urlError)
        // Fallback to public URL
        const { data: publicUrlData } = supabase.storage
          .from('photos')
          .getPublicUrl(uploadData.path)
        urlData.signedUrl = publicUrlData.publicUrl
      }

      const galleryImage: GalleryImage = {
        id: photoData.id,
        src: urlData.signedUrl,
        alt: photoData.title || photoData.file_name,
        title: photoData.title,
        description: photoData.description,
        dateAdded: new Date(photoData.created_at),
        moodDetected: photoData.mood_detected,
        moodConfidence: photoData.mood_confidence,
        aiAnalysis: photoData.ai_analysis
      }

      return { data: galleryImage, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async getUserPhotos(): Promise<{ data: GalleryImage[] | null; error: any }> {
    try {
      const { data: photos, error } = await supabase
        .from('photos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        return { data: null, error }
      }

      const galleryImages: GalleryImage[] = await Promise.all(
        photos.map(async (photo: PhotoRecord) => {
          const { data: urlData, error: urlError } = await supabase.storage
            .from('photos')
            .createSignedUrl(photo.file_path, 60 * 60 * 24 * 365) // 1 year expiry

          let imageUrl = '';
          if (urlError) {
            console.error('Error creating signed URL:', urlError)
            // Fallback to public URL
            const { data: publicUrlData } = supabase.storage
              .from('photos')
              .getPublicUrl(photo.file_path)
            imageUrl = publicUrlData.publicUrl
          } else {
            imageUrl = urlData.signedUrl
          }

          return {
            id: photo.id,
            src: imageUrl,
            alt: photo.title || photo.file_name,
            title: photo.title,
            description: photo.description,
            dateAdded: new Date(photo.created_at),
            moodDetected: photo.mood_detected,
            moodConfidence: photo.mood_confidence,
            aiAnalysis: photo.ai_analysis
          }
        })
      )

      return { data: galleryImages, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async deletePhoto(photoId: string): Promise<{ error: any }> {
    try {
      // Get photo record to find file path
      const { data: photo, error: fetchError } = await supabase
        .from('photos')
        .select('file_path')
        .eq('id', photoId)
        .single()

      if (fetchError) {
        return { error: fetchError }
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('photos')
        .remove([photo.file_path])

      if (storageError) {
        console.warn('Failed to delete file from storage:', storageError)
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('photos')
        .delete()
        .eq('id', photoId)

      return { error: dbError }
    } catch (error) {
      return { error }
    }
  },

  async updatePhoto(photoId: string, updates: Partial<Pick<PhotoRecord, 'title' | 'description' | 'mood_detected' | 'mood_confidence' | 'ai_analysis'>>): Promise<{ data: GalleryImage | null; error: any }> {
    try {
      const { data: updatedPhoto, error } = await supabase
        .from('photos')
        .update(updates)
        .eq('id', photoId)
        .select()
        .single()

      if (error) {
        return { data: null, error }
      }

      const { data: urlData } = supabase.storage
        .from('photos')
        .getPublicUrl(updatedPhoto.file_path)

      const galleryImage: GalleryImage = {
        id: updatedPhoto.id,
        src: urlData.publicUrl,
        alt: updatedPhoto.title || updatedPhoto.file_name,
        title: updatedPhoto.title,
        description: updatedPhoto.description,
        dateAdded: new Date(updatedPhoto.created_at),
        moodDetected: updatedPhoto.mood_detected,
        moodConfidence: updatedPhoto.mood_confidence,
        aiAnalysis: updatedPhoto.ai_analysis
      }

      return { data: galleryImage, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }
}
