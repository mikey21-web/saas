/**
 * Replicate Integration - Image Generation with Flux
 *
 * Uses Replicate API to generate images via Flux model
 * Cheap ($0.035/image) + Fast (3-5 seconds) + High quality
 */

interface ReplicateOutput {
  data?: string[];
  error?: string;
}

/**
 * Generate image using Flux via Replicate
 */
export async function replicateGenerateImage(
  prompt: string,
  options?: {
    width?: number;
    height?: number;
    steps?: number;
    guidance?: number;
  }
): Promise<string | null> {
  const apiKey = process.env.REPLICATE_API_TOKEN
  if (!apiKey) {
    console.error('REPLICATE_API_TOKEN not set')
    return null
  }

  try {
    // Create prediction
    const createRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'fed7149b2fe858fc7aec6cb67e17c5d8935ff4a7', // Flux dev version (high quality)
        input: {
          prompt,
          width: options?.width || 1024,
          height: options?.height || 1024,
          num_outputs: 1,
          num_inference_steps: options?.steps || 28,
          guidance_scale: options?.guidance || 3.5,
        },
      }),
    })

    if (!createRes.ok) {
      const error = await createRes.text()
      console.error('Replicate create prediction error:', error)
      return null
    }

    const prediction = await createRes.json() as any
    const predictionId = prediction.id

    // Poll for completion
    let completed = false
    let attempts = 0
    const maxAttempts = 60 // 5 minutes with 5-second intervals

    while (!completed && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 5000)) // 5 second wait
      attempts++

      const statusRes = await fetch(
        `https://api.replicate.com/v1/predictions/${predictionId}`,
        {
          headers: { 'Authorization': `Token ${apiKey}` },
        }
      )

      if (!statusRes.ok) continue

      const status = await statusRes.json() as any

      if (status.status === 'succeeded') {
        completed = true
        const output = status.output as string[]
        if (output && output.length > 0) {
          return output[0] // Return first generated image
        }
      } else if (status.status === 'failed') {
        console.error('Replicate prediction failed:', status.error)
        return null
      }
    }

    if (!completed) {
      console.error('Replicate prediction timeout')
      return null
    }

    return null
  } catch (error) {
    console.error('Replicate image generation error:', error)
    return null
  }
}

/**
 * Generate optimized image prompt for social media
 */
export function optimizeImagePrompt(
  originalPrompt: string,
  platform: 'instagram' | 'tiktok' | 'linkedin' | 'twitter' | 'facebook'
): string {
  const platformSpecs: Record<string, string> = {
    instagram: 'Instagram feed post, high quality, vibrant colors, professional, 1024x1024',
    tiktok: 'TikTok thumbnail, eye-catching, bold colors, 1080x1920 vertical',
    linkedin: 'LinkedIn professional post, corporate, clean design, business-appropriate, 1200x628',
    twitter: 'Twitter post image, attention-grabbing, readable on mobile, 1200x675',
    facebook: 'Facebook post image, engaging, shareable, 1200x628',
  }

  return `${originalPrompt}. ${platformSpecs[platform] || platformSpecs.instagram}. Professional, high quality, trending style.`
}

/**
 * Batch generate images for multiple platforms
 */
export async function replicateBatchGenerateImages(
  prompt: string,
  platforms: Array<'instagram' | 'tiktok' | 'linkedin' | 'twitter' | 'facebook'>
): Promise<Record<string, string | null>> {
  const results: Record<string, string | null> = {}

  // Generate in sequence to avoid rate limits
  for (const platform of platforms) {
    const optimized = optimizeImagePrompt(prompt, platform)
    const imageUrl = await replicateGenerateImage(optimized, {
      width: platform === 'tiktok' ? 1080 : 1024,
      height: platform === 'tiktok' ? 1920 : 1024,
    })
    results[platform] = imageUrl

    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  return results
}
