class PupilNotification {
  constructor(
    id, 
    pupilId, 
    title, 
    content, 
    isRead, 
    createdAt
  ) {
    this.id = id;
    this.pupilId = pupilId;
    this.title = title;       
    this.content = content;   
    this.isRead = isRead;
    this.createdAt = createdAt;
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new PupilNotification(
      doc.id,
      data.pupilId ?? '',
      data.title ?? {},               
      data.content ?? {},             
      data.isRead ?? false,         
      data.createdAt?.toDate() || null 
    );
  }
}

module.exports = PupilNotification;
