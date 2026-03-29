// Returns true only for valid Cloudinary image URLs over http/https
export const isValidCloudinaryImageUrl = (value) => {
  if (typeof value !== "string") {
    return false;
  }

  try {
    const parsedUrl = new URL(value.trim());
    const isWebUrl = ["http:", "https:"].includes(parsedUrl.protocol);
    const isCloudinaryHost = parsedUrl.hostname.includes("cloudinary.com");

    return isWebUrl && isCloudinaryHost;
  } catch {
    return false;
  }
};

export const buildImageData = (imageUrl, imagePublicId, fieldName = "Image") => {
  const hasImageUrl = imageUrl !== undefined && imageUrl !== null && `${imageUrl}`.trim() !== "";
  const hasImagePublicId =
    imagePublicId !== undefined &&
    imagePublicId !== null &&
    `${imagePublicId}`.trim() !== "";

  if (!hasImageUrl && !hasImagePublicId) {
    return null;
  }

  if (!hasImageUrl || !hasImagePublicId) {
    return {
      error: `${fieldName} url and public_id are both required when updating image`,
    };
  }

  const trimmedImageUrl = typeof imageUrl === "string" ? imageUrl.trim() : "";

  if (!isValidCloudinaryImageUrl(trimmedImageUrl)) {
    return {
      error: `${fieldName} has an invalid Cloudinary URL`,
    };
  }

  if (typeof imagePublicId !== "string" || !imagePublicId.trim()) {
    return {
      error: `${fieldName} public_id must be a non-empty string when image is provided`,
    };
  }

  return {
    url: trimmedImageUrl,
    public_id: imagePublicId.trim(),
  };
};
