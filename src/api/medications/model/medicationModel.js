import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const MedicationSchema = new Schema(
  {
    code: { type: String, index: true, sparse: true },
    description: { type: String, required: true, index: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 }
  },
  { timestamps: true }
);

MedicationSchema.index({ description: 'text' });

export default model('Medication', MedicationSchema);
