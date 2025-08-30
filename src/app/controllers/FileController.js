const { Upload } = require("@aws-sdk/lib-storage");
const { s3 } = require("../../config/awsConfig");

class FileController {
  uploadFile = async (file, key) => {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ACL: "public-read",
      ContentType: file.mimetype,
    };

    try {
      const uploadParallel = new Upload({
        client: s3,
        queueSize: 5,
        partSize: 10 * 1024 * 1024,
        leavePartsOnError: false,
        params,
      });

      uploadParallel.on("httpUploadProgress", (progress) => {
        console.log(progress);
      });

      const data = await uploadParallel.done();
      console.log("Upload completed!", { data });
      return data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  // uploadMultipleFiles = async (files) => {
  //   const uploadedFiles = {};

  //   for (const file of files) {
  //     const fileName = Date.now().toString() + "-" + file.originalname;
  //     console.log("Upload file: " + fileName);
  //     try {
  //       const uploadedFile = await this.uploadFile(file, fileName);
  //       uploadedFiles[file.fieldname] = process.env.CLOUD_FRONT + fileName;
  //     } catch (error) {
  //       console.error("Error during file upload:", error);
  //       throw error;
  //     }
  //   }

  //   return uploadedFiles;
  // };
  uploadMultipleFiles = async (files, textOption, textAnswer) => {
    const result = {
      image: null,
      option: [],
      answer: null,
      define: null,
      example: null,
      remember: null,
    };
    // Handle define file
    if (files.define && files.define.length > 0) {
      const file = files.define[0];
      const fileName = Date.now().toString() + "-" + file.originalname;
      console.log("Upload file: " + fileName);
      try {
        await this.uploadFile(file, fileName);
        result.define = `${process.env.CLOUD_FRONT}${fileName}`;
      } catch (error) {
        console.error("Error during define upload:", error);
        throw error;
      }
    }

    // Handle example file
    if (files.example && files.example.length > 0) {
      const file = files.example[0];
      const fileName = Date.now().toString() + "-" + file.originalname;
      console.log("Upload file: " + fileName);
      try {
        await this.uploadFile(file, fileName);
        result.example = `${process.env.CLOUD_FRONT}${fileName}`;
      } catch (error) {
        console.error("Error during example upload:", error);
        throw error;
      }
    }

    // Handle remember file
    if (files.remember && files.remember.length > 0) {
      const file = files.remember[0];
      const fileName = Date.now().toString() + "-" + file.originalname;
      console.log("Upload file: " + fileName);
      try {
        await this.uploadFile(file, fileName);
        result.remember = `${process.env.CLOUD_FRONT}${fileName}`;
      } catch (error) {
        console.error("Error during remember upload:", error);
        throw error;
      }
    }
    // Handle image file
    if (files.image && files.image.length > 0) {
      const file = files.image[0];
      const fileName = Date.now().toString() + "-" + file.originalname;
      console.log("Upload file: " + fileName);
      try {
        await this.uploadFile(file, fileName);
        result.image = `${process.env.CLOUD_FRONT}${fileName}`;
      } catch (error) {
        console.error("Error during image upload:", error);
        throw error;
      }
    }
    //text option 
    if (textOption) {
      try {
        let parsedOptions;
        if (Array.isArray(textOption)) {
          parsedOptions = textOption; // Already an array, use it directly
        } else if (typeof textOption === "string") {
          // Check if it's a JSON string
          if (textOption.startsWith("[") && textOption.endsWith("]")) {
            parsedOptions = JSON.parse(textOption); // Parse JSON array
            if (!Array.isArray(parsedOptions)) {
              throw new Error("Parsed textOption is not an array");
            }
          } else {
            parsedOptions = [textOption]; // Treat plain string as single-item array
          }
        } else {
          throw new Error("Invalid textOption type");
        }
        result.option.push(...parsedOptions); // Add options to result.option
      } catch (error) {
        console.error("Error parsing textOption:", error);
        throw new Error("Invalid textOption format");
      }
    }

    // Handle option files
    if (files.option && files.option.length > 0) {
      for (const file of files.option) {
        const fileName = Date.now().toString() + "-" + file.originalname;
        console.log("Upload file: " + fileName);
        try {
          await this.uploadFile(file, fileName);
          result.option.push(`${process.env.CLOUD_FRONT}${fileName}`); // Add image URLs to the array
        } catch (error) {
          console.error("Error during options upload:", error);
          throw error;
        }
      }
    }

    // Handle answer (text or image)
    if (textAnswer) {
      try {
        result.answer = textAnswer; // Store text answer directly
      } catch (error) {
        console.error("Error processing textAnswer:", error);
        throw new Error("Invalid textAnswer format");
      }
    } else if (files.answer && files.answer.length > 0) {
      const file = files.answer[0];
      const fileName = Date.now().toString() + "-" + file.originalname;
      console.log("Upload file: " + fileName);
      try {
        await this.uploadFile(file, fileName);
        result.answer = `${process.env.CLOUD_FRONT}${fileName}`; // Store image URL
      } catch (error) {
        console.error("Error during answer upload:", error);
        throw error;
      }
    }

    return result;
  };
}

module.exports = new FileController();