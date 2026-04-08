/**
 * Maps raw API/publish errors to user-friendly messages + internal error codes.
 *
 * Error code reference:
 *   IG_RECONNECT      - Instagram account token is invalid/expired, needs reconnecting
 *   IG_APP_REVIEW     - Instagram account hasn't been granted content publish permissions
 *   IG_NO_IMAGE       - Instagram posts require an image
 *   IG_CAROUSEL_EMPTY - Carousel has no slides
 *   IG_SLIDE_NO_IMAGE - A carousel slide is missing its image
 *   FB_PUBLISH_FAILED - Facebook Graph API rejected the post
 *   NO_ACCOUNT        - No social account linked to this post
 *   POST_NOT_FOUND    - Post record not found in the database
 *   UNSUPPORTED_PLATFORM - Platform not yet supported for direct publishing
 *   UNKNOWN           - Unrecognised error
 */

export type PublishError = {
  code: string
  message: string
  hint: string
}

export function friendlyError(raw: string): PublishError {
  const lower = raw.toLowerCase()

  // Instagram: wrong token / needs reconnect
  if (
    lower.includes('does not exist') ||
    lower.includes('cannot be loaded due to missing permissions') ||
    lower.includes('object with id') ||
    lower.includes('invalid oauth access token') ||
    lower.includes('session has been invalidated')
  ) {
    return {
      code: 'IG_RECONNECT',
      message: 'Your Instagram account needs to be reconnected.',
      hint: 'Go to Settings → Connected Accounts, disconnect Instagram, and reconnect it.',
    }
  }

  // Instagram: App Review / content_publish permission
  if (lower.includes('instagram_content_publish') || lower.includes('app review')) {
    return {
      code: 'IG_APP_REVIEW',
      message: 'Your Instagram account doesn\'t have publishing permission yet.',
      hint: 'Your Facebook App needs the instagram_content_publishing_actions permission approved. Facebook Page posting works immediately.',
    }
  }

  // Instagram: no image
  if (lower.includes('instagram requires an image')) {
    return {
      code: 'IG_NO_IMAGE',
      message: 'Instagram posts require an image.',
      hint: 'Add an image to this post before approving it.',
    }
  }

  // Instagram: carousel empty
  if (lower.includes('carousel post has no slides')) {
    return {
      code: 'IG_CAROUSEL_EMPTY',
      message: 'This carousel post has no slides.',
      hint: 'Edit the post and add at least one slide with an image.',
    }
  }

  // Instagram: slide missing image
  if (lower.includes('missing an image url')) {
    return {
      code: 'IG_SLIDE_NO_IMAGE',
      message: 'One or more carousel slides is missing an image.',
      hint: 'Edit the post and make sure every slide has an image.',
    }
  }

  // Facebook: generic graph API fail
  if (lower.includes('facebook publish failed') || lower.includes('facebook')) {
    return {
      code: 'FB_PUBLISH_FAILED',
      message: 'Facebook declined the post.',
      hint: 'Check that your Facebook Page is still connected and the post content follows Facebook\'s policies.',
    }
  }

  // No account linked
  if (lower.includes('no social account')) {
    return {
      code: 'NO_ACCOUNT',
      message: 'No social account is linked to this post.',
      hint: 'Edit the post and select a social account to publish to.',
    }
  }

  // Post not found
  if (lower.includes('post not found')) {
    return {
      code: 'POST_NOT_FOUND',
      message: 'Post not found.',
      hint: 'This post may have been deleted.',
    }
  }

  // Unsupported platform
  if (lower.includes('not yet supported for platform')) {
    return {
      code: 'UNSUPPORTED_PLATFORM',
      message: 'Direct publishing isn\'t supported for this platform yet.',
      hint: 'Use the manual export option to post to this platform.',
    }
  }

  // Fallback
  return {
    code: 'UNKNOWN',
    message: 'Something went wrong while publishing.',
    hint: raw,
  }
}
