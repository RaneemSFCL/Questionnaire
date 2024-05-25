const myHeaders = new Headers();
myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
const requestOptionsQuery = {
  method: "GET",
  redirect: "follow",
};
const featureService =
  "https://services3.arcgis.com/m8fOlhomhl4NOGhy/arcgis/rest/services/Questionnaire/FeatureServer";
let token;
let session;
let gender;
let department;
let images;
let questions;
let choices;

function generateToken() {
  const urlencoded = new URLSearchParams();
  urlencoded.append("f", "json");
  urlencoded.append("username", "tomhanks024");
  urlencoded.append("password", "Esri.4.GIS");
  urlencoded.append("referer", "https://www.arcgis.com");
  urlencoded.append("client", "referer");
  urlencoded.append("expiration", "120");

  const requestOptionsToken = {
    method: "POST",
    headers: myHeaders,
    body: urlencoded,
    redirect: "follow",
  };

  fetch(
    "https://www.arcgis.com/sharing/rest/generateToken",
    requestOptionsToken
  )
    .then((response) => response.json())
    .then((result) => ((token = result.token), (session = result.expires)))
    .then(() => main())
    .catch((error) => console.error(error));
}

function clearPage() {
  var container = document.getElementsByClassName("container")[0];
  container.innerHTML = "";

  var imageContainer = document.createElement("div");
  imageContainer.id = "imageContainer";
  container.appendChild(imageContainer);

  var nextBtn = document.createElement("button");
  nextBtn.id = "nextBtn";
  nextBtn.innerText = "Next";
  container.appendChild(nextBtn);
}

function fetchImages() {
  fetch(
    `${featureService}/0/query?where=1=1&outFields=*&f=json&token=${token}`,
    requestOptionsQuery
  )
    .then((response) => response.json())
    .then((result) => {
      const h3 = document.createElement("h3");
      h3.textContent = "Select places you like the most:";
      const h4 = document.createElement("h4");
      h4.textContent = "(min: 1 | max: 2)";
      imageContainer.appendChild(h3);
      imageContainer.appendChild(h4);
      let selectedImages = [];

      result.features.forEach((element) => {
        const imageURL = element.attributes.ImageURL;
        const OBJECTID = element.attributes.OBJECTID;
        const img = document.createElement("img");
        img.src = imageURL;
        img.alt = "Image";
        img.classList.add("image"); // Add 'image' class to each image
        img.addEventListener("click", () => {
          // Toggle selection state
          if (selectedImages.some((img) => img.OBJECTID === OBJECTID)) {
            img.classList.remove("selected");
            selectedImages = selectedImages.filter(
              (img) => img.OBJECTID !== OBJECTID
            );
          } else {
            // Check maximum selection limit
            if (selectedImages.length < 2) {
              img.classList.add("selected");
              selectedImages.push({ OBJECTID, imageURL });
            }
          }
        });
        imageContainer.appendChild(img);
      });

      // Next button functionality
      const nextButton = document.getElementById("nextBtn");
      nextButton.addEventListener("click", () => {
        // Check if two images are selected
        if (selectedImages.length <= 2 && selectedImages.length > 0) {
          // Query the service URL with selected OBJECTIDs
          images = selectedImages;
          fetchQuestions(0);
        } else {
          alert("Please select one or two images first!");
        }
      });
    })
    .catch((error) => console.error(error));
}

function fetchQuestions(i) {
  fetch(
    `${featureService}/1/query?where=1=1&outFields=*&f=json&token=${token}`,
    requestOptionsQuery
  )
    .then((response) => response.json())
    .then((result) => {
      clearPage();
      const img = document.createElement("img");
      img.src = images[i].imageURL;
      img.alt = "Image";
      img.classList.add("image");
      imageContainer.appendChild(img);
      questions = result.features;
      questions.forEach((q) => {
        const questionContainer = document.createElement("div");
        const questionElement = document.createElement("div");
        questionElement.textContent = q.attributes.Question;
        questionContainer.appendChild(questionElement);
        // const qChoices = fetchChoices(i, q.attributes.OBJECTID);
        fetch(
          `${featureService}/2/query?where=QuestionID=${q.attributes.OBJECTID}+and+(ImageID+is+null+or+ImageID=${images[i].OBJECTID})&outFields=*&f=json&token=${token}`,
          requestOptionsQuery
        )
          .then((response) => response.json())
          .then((result) => result.features)
          .then((features) => {
            features.forEach((c) => {
              const radioButton = document.createElement("input");
              radioButton.type = "radio";
              radioButton.id = c.attributes.OBJECTID;
              radioButton.name = q.attributes.Question;
              // radioButton.value = index;
              const label = document.createElement("label");
              label.textContent = c.attributes.Choice;
              questionContainer.appendChild(radioButton);
              questionContainer.appendChild(label);
              questionContainer.appendChild(document.createElement("br"));
            });
            questionContainer.appendChild(document.createElement("br"));
          })
          .catch((error) => console.error(error));
        imageContainer.appendChild(questionContainer);
      });
      const nextButton = document.getElementById("nextBtn");
      nextButton.addEventListener("click", () => {
        if (i + 1 < images.length) {
          fetchQuestions(++i);
        } else {
          clearPage();
          nextBtn.remove();
          const h1 = document.createElement("h1");
          h1.textContent = "Thanks for your contribution!";
          imageContainer.appendChild(h1);
        }
      });
    })
    .catch((error) => console.error(error));
}

function fetchChoices(i, questionID) {
  fetch(
    `${featureService}/2/query?where=QuestionID=${questionID}+and+(ImageID+is+null+or+ImageID=${images[i].OBJECTID})&outFields=*&f=json&token=${token}`,
    requestOptionsQuery
  )
    .then((response) => response.json())
    .then((result) => result.features)
    .catch((error) => console.error(error));
}

function main() {
  fetch(`${featureService}/4?f=pjson&token=${token}`, requestOptionsQuery)
    .then((response) => response.json())
    .then((result) => {
      // Gender question
      const genderDomain = result.fields.find(
        (field) => field.name === "Gender"
      ).domain;
      const genders = genderDomain.codedValues;

      const selectGender = document.getElementById("genderQuestion");

      genders.forEach((gender) => {
        const option = document.createElement("option");
        option.value = gender.code;
        option.textContent = gender.name;
        selectGender.appendChild(option);
      });

      // Department question
      const departmentDomain = result.fields.find(
        (field) => field.name === "Department"
      ).domain;
      const departments = departmentDomain.codedValues;

      const selectDepartment = document.getElementById("departmentQuestion");

      departments.forEach((department) => {
        const option = document.createElement("option");
        option.value = department.code;
        option.textContent = department.name;
        selectDepartment.appendChild(option);
      });

      // Disable submit button initially
      const nextBtn = document.getElementById("nextBtn");

      // Warn user when trying to submit without selecting both gender and department
      nextBtn.addEventListener("click", () => {
        const selectedGender = selectGender.value;
        const selectedDepartment = selectDepartment.value;
        if (selectedGender === "" || selectedDepartment === "") {
          alert("Please select gender and department to proceed.");
        } else {
          gender = selectedGender;
          department = selectedDepartment;
          clearPage();
          fetchImages();
        }
      });
    })
    .catch((error) => console.error(error));
}

document.addEventListener("DOMContentLoaded", () => {
  generateToken();
});
