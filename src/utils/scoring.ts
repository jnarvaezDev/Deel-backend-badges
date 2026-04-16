export const calculateTier = (score: number) => {
  if (score <= 39) return "Global Potential";
  if (score <= 59) return "Global Talent";
  if (score <= 79) return "Global Leader";
  return "Global Champion";
};