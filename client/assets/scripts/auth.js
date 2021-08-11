function showByID(id, flag) {
  if (flag) {
    $(id).removeClass("d-none");
  } else {
    $(id).addClass("d-none");
  }
}

function getTokens() {
  return JSON.parse(localStorage.getItem("miro-poster"));
}
function setTokens(board, password) {
  let tokens = getTokens();
  if (!tokens) {
    tokens = {};
  }
  if (!tokens[board]) {
    tokens[board] = password;
    localStorage.setItem("miro-poster", JSON.stringify(tokens));
  }
}

function auth(password) {
  let board = urlParams.get("board");
  if (!board || !board.length)
    board = window.location.pathname.replaceAll("/", "");
  console.log(password);
  showByID("#spinner-wrapper", true);
  $.post(
    `${server_url}/board/auth`,
    {
      url: board,
      password: password,
    },
    function (data, status) {
      if (data && data.success) {
        setTokens(board, password);

        //Show Container
        showByID("#container", true);
        let stage = new Stage("stage");
        init(stage, () => {
          window.stage = stage;

          const channelName = `private-${board}`;

          var collaboration = new Collaboration(stage, channelName);
          collaboration.initListners();
        });
      } else {
        showByID("#spinner-wrapper", false);
        showByID("#invalid-password", true);
      }
    }
  );
}

function checkURL() {
  let board = urlParams.get("board");
  if (!board || !board.length)
    board = window.location.pathname.replaceAll("/", "");

  console.log(board);

  $.post(
    `${server_url}/board/checkURL`,
    {
      url: board,
    },
    function (data, status) {
      if (data && data.success) {
        showByID("#spinner-wrapper", false);
        showByID("#signInFormWrapper", true);

        const tokens = getTokens();
        if (tokens && tokens[board]) {
          auth(tokens[board]);
        }
      } else {
        showByID("#spinner-wrapper", false);
        showByID("#error-page", true);
      }
    }
  );
}

$("#signInForm").submit(function (e) {
  e.preventDefault();
  const password = $("#password").val();
  auth(password);
});

checkURL();
