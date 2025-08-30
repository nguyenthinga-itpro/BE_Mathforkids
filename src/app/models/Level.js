class Level {
  constructor(
    id,
    level,
    name,
    isDisabled,
    createdAt,
    updatedAt
  ) {
    this.id = id;
    this.level = level;
    this.name = name;
    this.isDisabled = isDisabled;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new Level(
      doc.id,
      data.level,
      data.name ?? {},
      data.isDisabled ?? false,
      data.createdAt?.toDate().toLocaleString("vi-VN") ?? '',
      data.updatedAt?.toDate().toLocaleString("vi-VN") ?? ''
    );
  }
}

module.exports = Level;
