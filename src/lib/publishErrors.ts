export type PublishError = {
  code: string
  message: string
  hint: string
  raw: string // always stored so we can diagnose exactly what the API returned
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
      raw,
    }
  }

  // Instagram: App Review / content_publish permission
  if (lower.includes('instagram_content_publish') || lower.includes('app review')) {
    return {
      code: 'IG_APP_REVIEW',
      message: "Your Instagram account doesn't have publishing permission yet.",
      hint: "Your Facebook App needs the instagram_content_publish permission approved via App Review. Facebook Page posting works immediately.",
      raw,
    }
  }

  // Instagram: personal account (not Business/Creator)
  if (
    lower.includes('does not support this operation') ||
    lower.includes('not a business') ||
    lower.includes('not an instagram business') ||
    lower.includes('media type not supported') ||
    lower.includes('account type')
  ) {
    return {
      code: 'IG_NOT_BUSINESS',
      message: 'Your Instagram account must be a Business or Creator account.',
      hint: 'In the Instagram app go to Settings → Account → Switch to Professional Account. Then reconnect in PostPilot.',
      raw,
    }
  }

  // Instagram: no image
  if (lower.includes('instagram requires an image')) {
    return {
      code: 'IG_NO_IMAGE',
      message: 'Instagram posts require an image.',
      hint: 'Add an image to this post before approving it.',
      raw,
    }
  }

  // Instagram: carousel empty
  if (lower.includes('carousel post has no slides')) {
    return {
      code: 'IG_CAROUSEL_EMPTY',
      message: 'This carousel post has no slides.',
      hint: 'Edit the post and add at least one slide with an image.',
      raw,
    }
  }

  // Instagram: slide missing image
  if (lower.includes('missing an image url')) {
    return {
      code: 'IG_SLIDE_NO_IMAGE',
      message: 'One or more carousel slides is missing an image.',
      hint: 'Edit the post and make sure every slide has an image.',
      raw,
    }
  }

  // Facebook: generic graph API fail
  if (lower.includes('facebook publish failed') || lower.includes('facebook')) {
    return {
      code: 'FB_PUBLISH_FAILED',
      message: 'Facebook declined the post.',
      hint: "Check that your Facebook Page is still connected and the post content follows Facebook's policies.",
      raw,
    }
  }

  // No account linked
  if (lower.includes('no social account')) {
    return {
      code: 'NO_ACCOUNT',
      message: 'No social account is linked to this post.',
      hint: 'Edit the post and select a social account to publish to.',
      raw,
    }
  }

  // Post not found
  if (lower.includes('post not found')) {
    return {
      code: 'POST_NOT_FOUND',
      message: 'Post not found.',
      hint: 'This post may have been deleted.',
      raw,
    }
  }

  // Unsupported platform
  if (lower.includes('not yet supported for platform')) {
    return {
      code: 'UNSUPPORTED_PLATFORM',
      message: "Direct publishing isn't supported for this platform yet.",
      hint: 'Use the manual export option to post to this platform.',
      raw,
    }
  }

  // Fallback
  return {
    code: 'UNKNOWN',
    message: 'Something went wrong while publishing.',
    hint: raw,
    raw,
  }
}
