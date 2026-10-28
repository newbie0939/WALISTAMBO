const loginForm =
    document.getElementById("loginForm");

const loginError =
    document.getElementById("loginError");


loginForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();

        loginError.textContent = "";


        const username =
            document
                .getElementById("username")
                .value
                .trim();


        const password =
            document
                .getElementById("password")
                .value;


        if (
            username === "" ||
            password === ""
        ) {

            loginError.textContent =
                "Please enter your username and password.";

            return;
        }


        try {

            const response =
                await fetch(
                    "api/login.php",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        credentials:
                            "same-origin",

                        body:
                            JSON.stringify({

                                username:
                                    username,

                                password:
                                    password

                            })
                    }
                );


            const result =
                await response.json();


            if (!result.success) {

                loginError.textContent =
                    result.message ||
                    "Invalid username or password.";

                return;
            }



            window.location.href =
                result.redirect;


        } catch (error) {

            console.error(
                "Login error:",
                error
            );


            loginError.textContent =
                "Unable to connect to the server.";

        }

    }
);