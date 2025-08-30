const jwt = require("jsonwebtoken");

class User {
  constructor(
    id,
    fullName,
    phoneNumber,
    email,
    gender,
    dateOfBirth,
    address,
    role,
    isVerify,
    otpCode,
    otpExpiration,
    volume,
    language,
    mode,
    isDisabled,
    image,
    pin,
    createdAt,
    updatedAt
  ) {
    (this.id = id),
      (this.fullName = fullName),
      (this.phoneNumber = phoneNumber),
      (this.email = email),
      (this.gender = gender),
      (this.dateOfBirth = dateOfBirth),
      (this.address = address),
      (this.role = role),
      (this.isVerify = isVerify),
      (this.otpCode = otpCode),
      (this.otpExpiration = otpExpiration),
      (this.volume = volume),
      (this.language = language),
      (this.mode = mode),
      (this.isDisabled = isDisabled),
      (this.image = image),
      (this.pin = pin),
      (this.createdAt = createdAt),
      (this.updatedAt = updatedAt);
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new User(
      doc.id,
      data.fullName,
      data.phoneNumber,
      data.email,
      data.gender,
      data.dateOfBirth,
      data.address,
      data.role,
      data.isVerify,
      data.otpCode,
      data.otpExpiration,
      data.volume,
      data.language,
      data.mode,
      data.isDisabled,
      data.image,
      data.pin,
      data.createdAt?.toDate().toLocaleString("vi-VN"),
      data.updatedAt?.toDate().toLocaleString("vi-VN")
    );
  }

  getSignedJwtToken() {
    return jwt.sign({ id: this.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || "1d", // ví dụ: 1d = 1 ngày
    });
  }
}

module.exports = User;
