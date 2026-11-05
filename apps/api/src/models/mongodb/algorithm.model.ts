import mongoose, { Schema, Document } from 'mongoose';

export interface IAlgorithm extends Document {
  name: string;
  slug: string;
  category: string;
  description: string;
  timeComplexity: string;
  spaceComplexity: string;
  code: {
    javascript: string;
    python: string;
  };
  steps: string[];
}

const algorithmSchema = new Schema<IAlgorithm>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    timeComplexity: { type: String, required: true },
    spaceComplexity: { type: String, required: true },
    code: {
      javascript: { type: String, required: true },
      python: { type: String, required: true },
    },
    steps: [{ type: String }],
  },
  { timestamps: true }
);

const Algorithm = mongoose.model<IAlgorithm>(
  'Algorithm',
  algorithmSchema
);

export default Algorithm;