import Medication from '../../api/medications/model/medicationModel.js';

export default class MedicationRepository {
  async findByCode(code) {
    if (!code) return null;
    return Medication.findOne({ code });
  }

  async searchByText(query, limit = 10) {
    if (!query) return [];
    const textResults = await Medication.find(
      { $text: { $search: query } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit);
    if (textResults?.length) return textResults;
    const regex = new RegExp(
      query.replaceAll(/[-/\\^$*+?.()|[\]{}]/g, String.raw`\$&`),
      'i'
    );
    return Medication.find({ description: regex }).limit(limit);
  }

  async insertMany(docs) {
    if (!Array.isArray(docs)) throw new TypeError('Docs must be an Array[].');
    return Medication.insertMany(docs);
  }

  async deleteAll() {
    return Medication.deleteMany({});
  }
}
