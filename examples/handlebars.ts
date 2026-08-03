import { createState } from "@cezarsmpio/tinytivity";
import Handlebars from "handlebars";

const [user, watchUser] = createState({
  name: "John",
  age: 30,
});

Handlebars.registerHelper("loud", function (value) {
  return value.toUpperCase();
});

Handlebars.registerHelper("bold", function (text) {
  const result = "<b>" + Handlebars.escapeExpression(text) + "</b>";
  return new Handlebars.SafeString(result);
});

const userTemplate = Handlebars.compile(
  "<p>{{name}} is {{bold age}} {{loud 'years old!'}}</p>",
);

function renderUser() {
  // e.g. on the browser:
  // document.querySelector('#user-template').innerHTML = userTemplate(user.value)
  console.log(userTemplate(user.value));
}

watchUser(() => renderUser(), { immediate: true });

setTimeout(() => {
  user.value = { name: "John Doe", age: 31 };
}, 2000);
