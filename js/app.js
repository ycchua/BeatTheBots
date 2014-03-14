      var app = angular.module('myApp', ['ngResource', 'firebase']);

      app.controller("LoginController", ["$scope", "$firebase", "$firebaseSimpleLogin",
        function($scope, $firebase, $firebaseSimpleLogin) {
          var ref = new Firebase("https://shenrui1992.firebaseio.com/");
          $scope.auth = $firebaseSimpleLogin(ref);
        }
      ]);

      function FirstController($scope, $resource) {
        $scope.supported_langugages = [{
          language: 'python',
          urlName: 'python'
        }, {
          language: 'java',
          urlName: 'java'
        }, {
          language: 'ruby',
          urlName: 'ruby'
        }, {
          language: 'js',
          urlName: 'js'
        }, ];

        $scope.language = 'js';
        $scope.bots = [];
        $scope.new_bot = {
          name: 'New Bot',
          language: 'js',
          code: "function play_game(board,side) {\n  return board.replace('_',side);\n}"
        };
        first_bot = {
          name: "First Bot",
          language: 'js',
          code: "function play_game(board,side) {\n  return board.replace('_',side);\n}"
        };
        skip_bot = {
          name: "Skip Bot",
          language: 'js',
          code: "function play_game(board,side) {\n  if(board.indexOf('___') > -1) {\n    return board.replace('___','__'+side);\n  } else {\n    return board.replace('_',side);\n  }\n}"
        };
        bad_bot = {
          name: "Bad Bot",
          language: 'js',
          code: "function play_game(board,side) {\n  return '___,___,___';\n}"
        };
        
        $scope.add_bot = function() {
          $scope.bots.push($scope.new_bot);
          $scope.new_bot = {};
        }

        $scope.bots.push(first_bot);
        $scope.bots.push(skip_bot);
        $scope.bots.push(bad_bot);

        //Some example code for each language.
        $scope.d = {
          "js": {
            "solution": "function play_game(board,side) {\n  return '_________';\n}",
            "tests": "assert_equal('ANYTHING',play_game('_________','X'))"
          },
          "python": {
            "solution": "def play_game(board,side):\n  return '_________'",
            "tests": ">>> play_game('___,___,___','X')\n  'ANYTHING'\n"
          },
          "java": {
            "solution": "int a = 2;\nint b = 5;\nint c=a+1;\na=8+b-c;",
            "tests": "assertEquals(10,a);\nassertEquals(3,c)"
          },
          "ruby": {
            "solution": "a = 1\nb = 2",
            "tests": "assert_equal(1,a)\nassert_equal(2,b)",
            "hosts": ["parserplayground-staging.appspot.com/ruby?id=1", "parserplayground-staging.appspot.com/ruby?id=2"]
          }
        }


        $scope.status = "Ready"
        //Load some good code
        $scope.load_example_code = function() {
          $scope.solution = $scope.d[$scope.language]["solution"];
          $scope.tests = $scope.d[$scope.language]["tests"];
        };


        // For the loadbalancer version with fewer options. 
        $scope.VerifierModel = $resource('/verify', {}, {
          'get': {
            method: 'GET',
            isArray: false,
            params: {
              lang: $scope.language
            },
          'verify': {
            method: 'POST'
          }
          }
        });
        $scope.set_bot_1 = function(bot) {
          $scope.bot1 = bot;
          $scope.solution = bot.code;
        };

        $scope.set_bot_2 = function(bot) {
          $scope.bot2 = bot;
          $scope.solution = bot.code;
        };
        $scope.is_move_valid = function(board, move) {
          if (move.split("_").length - 1 < board.split("_").length - 1) {
            console.log("returning true. board " + board.indexOf('_') + " move " + move.indexOf('_'));
            return true;
          } else {
            console.log("returning false");
            return false;
          }

        };
        $scope.game_status = function(board) {
          //Only 8 ways to win and check for. 
          for (var i = 0; i < 3; i++) {
            //vertical down moving across
            console.log(i);
            if (board[0 + i] == 'X' && board[0 + i] == board[4 + i] && board[4 + i] == board[8 + i]) {
              return {
                finished: true,
                winner: 'X'
              };
            }
            //horizontal across moving down
            if (board[0 + 4 * i] == 'X' && board[0 + 4 * i] == board[1 + 4 * i] && board[1 + 4 * i] == board[2 + 4 * i]) {
              return {
                finished: true,
                winner: 'X'
              };
            }
          }
          //diagonals
          if (board[0] == 'X' && board[0] == board[5] && board[5] == board[10]) {
            return {
              finished: true,
              winner: 'X'
            };
          } else if (board[2] == 'X' && board[2] == board[5] && board[5] == board[8]) {
            return {
              finished: true,
              winner: 'X'
            };
          }
          //Full board
          else if (board.indexOf('_') === -1) {
            return {
              finished: true,
              winner: 'Tie'
            };
          } else {
            return {
              finished: false
            }
          }

        };


        $scope.reset_game = function() {
          $scope.current_board = "___,___,___";
          $scope.game_history = [];

        };

        $scope.reset_game();


        $scope.play_game = function(playerX, playerO) {

          console.log("Playing bot 1 against bot 2");

          //Count X's to see who's turn it is.
          numX = $scope.current_board.split("_").length - 1;
          if (numX % 2 === 1) {
            tests = "assert_equal('ANYTHING',play_game('" + $scope.current_board + "','X'))";
            data = {
              solution: playerX.code,
              tests: tests
            };
          } else {
            tests = "assert_equal('ANYTHING',play_game('" + $scope.current_board + "','O'))";
            data = {
              solution: playerO.code,
              tests: tests
            };

          }
          jsonrequest = data;

          response = $scope.VerifierModel.get({
              'lang': $scope.language,
              'jsonrequest': jsonrequest
          });
          response.lang = $scope.language;
          response.jsonrequest = jsonrequest;
          response.$save(function(r) {
            $scope.result = r;
            console.log(r);
            new_board = r.results[0].received;
            console.log("the new board " + new_board);
            $scope.game_history.push(new_board);
            //Check of board is valid
            if (!$scope.is_move_valid($scope.current_board, new_board)) {
              return false;
            }
            $scope.current_board = new_board;
            
            //Check if the game is over and who won. 
            game_check = $scope.game_status($scope.current_board);
            //Keep calling play_game until game is finished.
            if (!game_check.finished) {
              $scope.play_game(playerX, playerO);
            } else {
              $scope.winner = game_check.winner;
            }
          });
        };

        $scope.verify = function(data) {
          //data = {solution: $scope.solution, tests: $scope.tests}
          //jsonrequest = JSON.stringify(data) 
          jsonrequest = data;

          $scope.status = "Verifying";
          result = $scope.VerifierModel.get({
            'lang': $scope.language,
            'jsonrequest': jsonrequest
          });
          result.lang = $scope.language;
          result.jsonrequest = jsonrequest
          result.$save();
          $scope.result = result;
          return result;

        };

      }