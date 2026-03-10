import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

export async function checkMisinfo(content) {
  try {
    const result = await hf.zeroShotClassification({
      model: 'facebook/bart-large-mnli',
      inputs: content,
      parameters: {
        candidate_labels: ['factual', 'misinformation', 'unverified']
      }
    });
    return {
      label: result.labels[0],
      confidence: result.scores[0],
      isSuspect: result.labels[0] !== 'factual' && result.scores[0] > 0.75
    };
  } catch {
    return { label: 'unknown', confidence: 0, isSuspect: false };
  }
}
