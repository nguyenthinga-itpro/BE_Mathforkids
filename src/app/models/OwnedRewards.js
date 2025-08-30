class OwnedRewards {
    constructor(id, pupilId  , rewardId, quantity, createdAt, updatedAt) {
      (this.id = id),
        (this.pupilId = pupilId),
        (this.rewardId = rewardId),
        (this.quantity = quantity),
        (this.createdAt = createdAt),
        (this.updatedAt = updatedAt);
    }

    static fromFirestore(doc) {
      const data = doc.data();
      return new OwnedRewards(
        doc.id,
        data.pupilId , 
        data.rewardId,
        data.quantity, 
        data.createdAt?.toDate().toLocaleString("vi-VN"),
        data.updatedAt?.toDate().toLocaleString("vi-VN")
      );
    }
  }
  
  module.exports = OwnedRewards;