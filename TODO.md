# TODO
https://discordjs.guide/slash-commands/advanced-creation.html#subcommands


Weekly update loop. 

## Plant Workflow
`/plant`
    ```
    @character
    @params NAME
    @params FERTILIZER = NORMAL | ROBUST | FORTIFYING | ENRICHING | SPEEDGROW? | MIRACLEGROW? | MYSTERYGROW?
    ```
    - User states they're planting a plant, specifying the fertilizer the plant is planted in.
    -- User can update the fertilizer.
    - When plant is finished, the user should be informed of their harvest.


`/harvest` - not needed? 
    ```
    @params character 
    @params HARVEST_SEEDS = TRUE | FALSE
    ```
    - User runs command to harvest specific harvestable plant?
    - Ask User if harvesting seeds 
    - Prompt user to replants plants that were harvested.
    - Summary of harvest

    `/harvestall` - not needed?
    @params character 
    - User runs command to harvest all harvestable plants from one character. 
    - Summary of harvest

    `/removeplant`
    ```
    @params ID
    ```
    - User removes a plant from their garden.

    /updateplantfertilizer
    - allows the user to override the fertilizer it has however needs to be freshly harvested or matured. 

    /updateplant
    - allows the user to override current values of the plant's tracked information 

    @params character
    `/showplants`
    - Displays all plants for a set character. 

    `/showallplants`
    - Displays every plant in everyone's garden 
        - ordered by user -> character -> time 

- Users Table 
    @params Character name
    - User ID and Character Name

Add Database Column to Plants `fertilizer`

Create Table `fertilizer_types`
    ```
    id: integer
    name: string
    harvest_time_adjustment: int
    yield_muiltiplier: int/flt
    ```

- Help command

## Buildings

`/addBuilding`
@params discord_ID
@params Name of building
@params length in weeks
@params tier of building
- same as before

`/showBuildings`
- same as before

`/update building`
@params discord_ID
@params Name of building
@params length in weeks
@params tier of building
- same as before


## Items

`/addItem`
@params character
@params Name of item
@params length in weeks
- same as before

`/combineItems`
@params item1 rarity
@params item2 rarity
@params character
@params Name of item
- grab the 2 rarities to determine how much runick it would cost. 
- set the length in weeks to be the higher of the rarity +1 weeks. 
- calls add item command. 

`/removeItem`
@params item_ID

`/showItems`
- same as before

`/update Items`
@params character
@params Name of building
@params length in weeks
@params tier of building
- same as before

## Boats

migrate boats logic to bot

migrate jobs logic to bot 


`/updateboatitem`

`/buyItem` [boat] [item] [character] 

boat:
dropdown with current boats in town
item:
items in boat
character:
if database allows tracking if they've bought this week to display

## Misc

`addTimer`
@params discord_ID
@params Name of timer
@params length in weeks
- 

`updateTimer`
- allows the user to override current values of the timer's tracked information 

`removeTimer`
- deletes the entry. 


## User

birthdays should be included, but not required in the userdb


`addBirthday`
@params discord_ID or characterName
@params date - Formatted: DD/MM/YYY
- Attaches birthdate to the character *and spits out age?*

`updateAge` (this might be due to some time fuckery)
@params discord_ID or characterName
@params new age
- updates the age of the inputed character

`showCharacter`
@params characterName
- shows information of the character requested, should most likely only be the user's character