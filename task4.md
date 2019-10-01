## Protocol for a Labyrinth Server-Client Interaction 

The first three sections explain the interaction arrangements between the
user, the `client` program, and the `server` component. The remaining
sections specify the format of the messages. 

### Start Up Steps 

```
---------------------------------------------------------------------------------------------------
     labyrinth server                                      +------- user launches `./client'
                              ||                           |              | 
             |                ||          lab client <----+               |
             |                ||            |                             |
             |<-----------------------------| tcp connect                 |
             |                ||            |                             |
             |<~~~~~~~~~~~~~~~~~~~~~~~~~~~~~| sign-up name                |
             |~~~~~~~~~~~~~~~~~~~~~~~~~~~~~>| receive internal name       | 
             |                ||            |                             |
             |                ||            |<----------------------------| create labyrinth
```

The `client` program should be prepared to consume up to three arguments: 
- the TCP address of the server, default: `LOCALHOST`
- the Port number at the server; default: `8000`
- the name of the user; default: `John Doe` 

### Processing Phase 

```
---------------------------------------------------------------------------------------------------
     labyrinth server         ||       lab client                     user enters requests
                              ||                                          | 
             |                ||            |                             |
             |                ||            |<----------------------------| add token requests 
             |                ||            |                             |
            ...              ....          ...                           ...
             |                ||            |                             |
             |                ||            |<----------------------------| reachable? query
             |<~~~~~~~~~~~~~~~~~~~~~~~~~~~~~| send batch                  |
             |~~~~~~~~~~~~~~~~~~~~~~~~~~~~~>| receive at response         | 
             |                ||            |---------------------------->| render response 
             |                ||            |                             | ...
             |                ||            |<----------------------------| add token requests 
             |                ||            |                             |
            ...              ....          ...                           ...
             |                ||            |                             |
             |                ||            |<----------------------------| reachable? query
             |<~~~~~~~~~~~~~~~~~~~~~~~~~~~~~| send batch                  |
             |~~~~~~~~~~~~~~~~~~~~~~~~~~~~~>| receive at response         | 
             |                ||            |---------------------------->|
            ...              ....          ...                           ...
```


### Shut Down Steps 

```
---------------------------------------------------------------------------------------------------
     labyrinth server         ||       lab client                     user closes STDIN
             |                ||            |                             |
             |                ||            |<--------------------------- | ^D to client
             |<-----------------------------| tcp disconnect             ---
             |                ||           ---                            
```

### User Requests 

The user employs the exact same commands as in specified in [assignment C](
http://www.ccs.neu.edu/home/matthias/4500-f19/C.html) 

### TCP Messages
             
|  message                |  well-formed JSON format                             | denotation                        |
| ----------------------- | ---------------------------------------------------- | --------------------------------- |
| sign-up name            | string                                               | "observations" are expressed in   |
| internal name           | string (this distinguishes all connections)          | terms of a unique internal name   |
|                         |                                                      |                                   |
| batch                   | `[["lab", [string, ...], [[string, string], ...]],`  | sets up labyrinth, ...	     |
|                         | ` ["add",Color,string], ...,`                  	 | ... with tokens    		     |
| 			  | ` ["move",Color,string]]`                            | ending in query		     |
|			  |  							 | 	     			     |
| response                | [ADD, ..., Boolean] 	     			 | the ADDs are well-formed but invalid ADD requests, |
|                         |                                                      | the Boolean is the answer to move |

From the perspective of `client`, all JSON values that match the above format are well-formed and valid. If the user
enters JSON that does not represent a well-formed request, `client` says  

- ["not a request", JSON] for whatever JSON the user entered 
 

From the perspective of `server`, validity requires the satisfaction of additional constraints: 

|  message type           |  well-formed shape	                                 | validity                          |
| ----------------------- | ---------------------------------------------------- | --------------------------------- |
| LON = 		  | array of Nodes					 | 				     |
| Node = 		  | String   						 | 				     |
| LOE = 		  | array of 2-element arrays				 | each of which contains two Nodes  |
|     			  | 	     	       					 | meaning the strings must be in LON |
| ADD = 		  | ["add", Color, Node]				 | the Node must be in LON     	  |
| QQ = 			  | ["move", Color, Node]				 | the Color must have been set,  |
|    			  | 	     	    					 | and the Node must be in LON 	  |
| Color = 		  | String, one of: "white" "black" "red" "green" "blue" |     	   	     	   	  |
| 			  | 	    	    	    	    	  	  	 |				  |

The server will shut down the connection if the "batch" command is ill-formed, 
if the "create" command fails to be valid, or if the "move" command is invalid. 

If an ADD request is well-formed but invalid, it gets sent back. 

The `client` program Renders responses as quasi-Englush JSON for the user as follows: 

- ["the server will call me", String]
- ["invalid", ADD] 
- ["the response to", QQ, "is", Boolean]
