# How I met your mother script crawler

This is a program that gets scripts of all episodes of ["How I met your mother"]("https://en.wikipedia.org/wiki/How_I_Met_Your_Mother") from [a web site](https://transcripts.foreverdreaming.org/viewforum.php?f=177) and makes PDF files for learning English.

## Usage

generate pdf for the first episode of season 1

```
npm test
```

generate pdf for all episodes

```
npm run start
```

## Structure

```
.
├── pdf                                     # output directory
└── src                                     #
    ├── crawler                             # crawler
    ├── pdf-generator                       # pdf generator
    ├── lib                                 #
    ├── app.ts                              # starting point
    └── test.ts                             # test file
```

## Output example

![output example](./images/output-example.png)
