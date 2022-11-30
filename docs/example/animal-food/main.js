const animalData = [
  { name: 'Komodo', food: 'carnivore' },
  { name: 'Panda', food: 'herbivore' },
  { name: 'Tiger', food: 'carnivore' },
  { name: 'Checken', food: 'omnivore' },
  { name: 'Monkey', food: 'omnivore' },
];

const foodData = [
  "carnivore",
  "herbivore",
  "omnivore",
];

const initData = async () => {

  // only if no animal store in database storage, create the new one

  const animalStore = await CStorage.getGlobal('Animal');

  if (!animalStore) {
    CStorage.addGlobal('Animal', animalData);
  }

  // only if no food store in database storage, create the new one

  const foodStore = await CStorage.getGlobal('Food');

  if (!foodStore) {
    CStorage.addGlobal('Food', foodData)
  }

  initDataDOM();

}

const initDataDOM = async () => {
  const animalStore = await CStorage.getGlobal('Animal');
  const foodStore = await CStorage.getGlobal('Food');
  const animalSelected = await CStorage.getLocal('AnimalSelected');
  const foodSelected = await CStorage.getLocal('FoodSelected');

  let animalHtml = '';
  for (const animal of animalStore.data) {
    if (animalSelected && animalSelected.data && animal.name === animalSelected.data.name) {
      animalHtml += `
        <div class="col-lg-3">
          <button class="btn btn-primary active" type="button" style="width: 100%;" onClick="selectAnimal('${animal.name}')">
            ${animal.name}<br>
          </button>
        </div>
      `;
    } else {
      animalHtml += `
        <div class="col-lg-3">
          <button class="btn btn-primary" type="button" style="width: 100%;" onClick="selectAnimal('${animal.name}')">
            ${animal.name}<br>
          </button>
        </div>
      `;
    }
  }

  $('#animal-conatiner').html(animalHtml);

  let foodHtml = '';
  for (const food of foodStore.data) {
    if (foodSelected && foodSelected.data && food === foodSelected.data) {
      foodHtml += `
        <div class="col-lg-3">
          <button class="btn btn-primary active" type="button" style="width: 100%;" onClick="selectFood('${food}')">
            ${food}<br>
          </button>
        </div>
      `;
    } else {
      foodHtml += `
        <div class="col-lg-3">
          <button class="btn btn-primary" type="button" style="width: 100%;" onClick="selectFood('${food}')">
            ${food}<br>
          </button>
        </div>
      `;
    }

  }

  $('#food-conatiner').html(foodHtml);

  if (animalSelected?.data.name && foodSelected?.data) {
    $('#result-check').html(animalSelected.data.name + ' is a ' + foodSelected.data);
  } else {
    $('#result-check').html(' - ');
  }

}

const selectAnimal = async (name) => {
  const animalStore = await CStorage.getGlobal('Animal');
  const animalData = animalStore.data.find((data) => data['name'] === name);

  CStorage.putLocal('AnimalSelected', { name: animalData.name, food: animalData.food });

  // re-render dom element
  initDataDOM();
}

const selectFood = async (name) => {
  const foodStore = await CStorage.getGlobal('Food');
  const foodData = foodStore.data.find((data) => data === name);

  CStorage.putLocal('FoodSelected', foodData);

  // re-render dom element
  initDataDOM();
}

const resultCheck = async () => {
  const animalStore = await CStorage.getLocal('AnimalSelected');
  const foodStore = await CStorage.getLocal('FoodSelected');

  if (!animalStore || !foodStore) {
    alert('Please select animal and food first 😊');
    return;
  }

  const score = await CStorage.getGlobal('Score');

  let correctScore = score?.data ? score.data.correct : 0;
  let wrongScore = score?.data ? score.data.wrong : 0;

  if (animalStore?.data?.food === foodStore.data) {
    $('#result-check').html('CORRECT!!').addClass('text-success');
    correctScore += 1;
  } else {
    $('#result-check').html('WRONG!!').addClass('text-danger');
    wrongScore += 1;
  }

  CStorage.putGlobal('Score', {
    correct: correctScore,
    wrong: wrongScore,
  });

  CStorage.deleteLocal('AnimalSelected');
  CStorage.deleteLocal('FoodSelected');

  // re-render dom element
  initDataDOM();
  // re-render score board
  await updateScoreBoard();
}

const updateScoreBoard = async () => {
  const score = await CStorage.getGlobal('Score');

  correctScore = score?.data ? score.data.correct : 0;
  wrongScore = score?.data ? score.data.wrong : 0;

  document.getElementById('correct-answer').innerHTML = correctScore;
  document.getElementById('wrong-answer').innerHTML = wrongScore;
}

const newGame = async () => {
  CStorage.deleteGlobal('Score');
  CStorage.deleteLocal('AnimalSelected');
  CStorage.deleteLocal('FoodSelected');

  await initData();
  await updateScoreBoard();
}

document.addEventListener("DOMContentLoaded", async () => {
  await initData();
  await updateScoreBoard();
});

window.onerror = () => {
  console.log('error');
}