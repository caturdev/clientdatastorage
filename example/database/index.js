const collections = [
  { collection: 'User', key: 'id', autoIncrement: true },
];

document.getElementById('submit-data').onclick = function (e) {
  e.preventDefault();

  const formElement = document.getElementById('form');

  const data = {
    name: formElement.elements.name.value,
    email: formElement.elements.email.value,
    password: formElement.elements.password.value,
  }

  CDatabase.add('User', data);

  // reset form
  resetForm();

  // update user table data
  updateTable();

}

document.getElementById('clear-data').onclick = function (e) {
  e.preventDefault();

  CDatabase.clear('User');

  updateTable();

}

const updateData = async (id) => {

  // change action button
  document.getElementById('submit-data').style.display = 'none';
  document.getElementById('clear-data').style.display = 'none';
  document.getElementById('update-data').style.display = 'block';

  const userData = await CDatabase.get('User', id);

  const formElement = document.getElementById('form');
  formElement.elements.name.value = userData.name;
  formElement.elements.email.value = userData.email;
  formElement.elements.password.value = userData.password;

  document.getElementById('update-data').onclick = async function (e) {
    e.preventDefault();

    const userCollection = await CDatabase.get('User');

    const data = {
      ...userCollection,
      id: userData.id,
      name: formElement.elements.name.value,
      email: formElement.elements.email.value,
      password: formElement.elements.password.value,
    }

    CDatabase.put('User', data);

    // reset form
    resetForm();

    // change action button
    document.getElementById('submit-data').style.display = 'block';
    document.getElementById('clear-data').style.display = 'block';
    document.getElementById('update-data').style.display = 'none';

    updateTable();
  }

}

const deleteData = (id) => {
  CDatabase.delete('User', id);
  updateTable();
}

const updateTable = async function () {

  const data = await CDatabase.get('User');

  document.getElementById('body-data').innerHTML = '';
  let index = 0;
  let html = '';
  for (const userData of data) {
    html += `
      <tr>
        <td style="text-align: center;">${++index}</td>
        <td>${userData.name}</td>
        <td>${userData.email}</td>
        <td>${userData.password}</td>
        <td style="display: flex;">
          <button type="button" class="form-btn-update" onClick="updateData(${userData.id})"> Update </button>
          <button type="button" class="form-btn-clear" onClick="deleteData(${userData.id})"> Delete </button>
        </td>
      </tr>
    `;
  };
  document.getElementById('body-data').innerHTML = html;
}

const resetForm = () => {
  const formElement = document.getElementById('form');
  formElement.elements.name.value = '';
  formElement.elements.email.value = '';
  formElement.elements.password.value = '';
}

console.log('loaded on ' + Date());
updateTable();
