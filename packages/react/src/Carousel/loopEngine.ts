// The infinite-loop transform engine's positioning maths (RFC 0018) now lives
// in @primitiv-ui/core, shared with the elements (RFC 0033); these names stay
// for anything importing them from here.
export {
  carouselFlingTarget as flingTarget,
  carouselNormalizeOffset as normalizeOffset,
  carouselShortestStep as shortestStep,
  carouselSnapTarget as snapTarget,
} from "@primitiv-ui/core";
