const collections = [
  { collection: 'User', key: 'id', autoIncrement: true },
];

document.getElementById('form').onsubmit = function (e) {
  e.preventDefault();

  const data = {
    name: e.target.elements.name.value,
    email: e.target.elements.email.value,
    password: e.target.elements.password.value,
  }

  CDatabase.add('User', data);

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
        <td>${++index}</td>
        <td>${userData.name}</td>
        <td>${userData.email}</td>
        <td>${userData.password}</td>
      </tr>
    `;
  };
  document.getElementById('body-data').innerHTML = html;
}

console.log('loaded on ' + Date());
updateTable();
