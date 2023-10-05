# Khulnasoft - So Now You Know!

Note: Khulnasoft is currently only available for private beta testing. [Email us](mailto:contact@khulnasoft.com) if you want to join the beta.

## Installation & Getting Started

Khulnasoft helps you find and fix known vulnerabilities in your Node.js dependencies, both ad hoc and as part of your CI (Build) system. 

To get up and running quickly, run these commands to install, authenticate and perform a quick test. Note that while we authenticate using GitHub, we *do not* require access to your repositories (only your email):
```shell
# If you're using node 0.10, first install npm 2 to support scoped modules, like so:
# npm install -g npm@2
npm install -g khulnasoft
khulnasoft auth
khulnasoft test ionic@1.6.5
```

You can now see an example of several known vulnerabilities found on an older version of `ionic`, as well as guidance on how to understand and address them. In the next sections we'll explain how to run the same test on your own projects.

## test

To test your own project for known vulnerabilities, browse to your project's folder and run `khulnasoft test`, like so (swapping the folder with your project's folder):
```shell
cd ~/projects/myproj/
khulnasoft test
```

`khulnasoft test` will take stock of all the local dependencies and their installed versions, and report them to Khulnasoft. The Khulnasoft servers will check if there are known vulnerabilities on these dependencies, and if so report about them and and suggest any remediation you can take. Since `khulnasoft test` looks at the locally installed modules, it needs to run after `npm install`, and will seamlessly work with `shrinkwrap`, npm enterprise or any other custom installation logic you have.

`khulnasoft test` can also get a folder name as an argument, which is especially handy if you want to test multiple projects. For instance, the following command tests all the projects under a certain folder for known vulnerabilities:
```shell
cd ~/projects/
find . -type d -maxdepth 1 | xargs -t -I{} khulnasoft test  {}
```

Lastly, you can also use `khulnasoft test` to scrutinize a public package before installing it, to see if it has known vulnerabilities or not. Using the package name will test the latest version of that package, and you can also provide a specific version or range using `khulnasoft test module[@semver-range]`.
```shell
khulnasoft test lodash
khulnasoft test ionic@1.6.5
```

If you ran khulnasoft locally and found vulnerabilities, you should proceed to use `khulnasoft protect` to address them.

## protect

Khulnasoft's `protect` helps you address the known vulnerabilities `khulnasoft test` found. 
To get started, run `protect` in interactive mode:
```shell
khulnasoft protect -i
```

Protect's interactive mode will run `test` again, and ask you what to do for each found issue. Here are the possible remediation steps for each vulnerability:

- `Upgrade` - if upgrading a direct dependency can fix the current vulnerability, `khulnasoft protect` can automatically modify your Package.json file to use the newer version. Note that you'll still need to run `npm update` afterwards to get the new packages.
- `Ignore` - If you believe this vulnerability does not apply to you, or if the dependent module in question never runs on a production system, you can choose to ignore the vulnerability. By default, we will ignore the vulnerability for 30 days, to avoid easily hiding a true issue. If you want to ignore it permanently, you can manually edit the generated `.khulnasoft` file.
- `Patch` - Sometimes there is no direct upgrade that can address the vulnerability, or there is one but you cannot upgrade due to functional reasons (e.g. it's a major breaking change). For such cases, `khulnasoft protect` lets you patch the issue with a patch applied locally to the relevant dependency files. We manually create and maintain these patches, and may not have one for every issue. If you cannot upgrade, patch is often a better option than doing nothing *Note: patch is not yet enabled in the private beta, it will be soon. In the meantime, patch will be replaced with a short ignore*.

Once completed, `khulnasoft protect -i` will create a local `.khulnasoft` file that guides non-interactive executions of `khulnasoft protect`. Note that `khulnasoft protect` will never unilaterally decide to ignore or patch a vulnerability - it will simply follow the guidance captured in the `.khulnasoft` file.

## Integrating Khulnasoft into your dev workflow

To continuously test against and protect from known vulnerabilities, integrate Khulnasoft into your continuous integration (a.k.a. build) system. Here are the steps required to to so:

1. Add `khulnasoft` to your project's dependencies (`npm install -S khulnasoft`), and commit the change in
2. Ensure the `.khulnasoft` file you generated was added to your source control (`git add .khulnasoft`);
3. After the `npm install` steps in your CI, run `khulnasoft protect` to apply any necessary patches
4. Run `khulnasoft test` to identify on any known vulnerabilities not already ignored or patched. If such vulnerabilities were found, `khulnasoft test` will return a non-zero value to fail the test.

A few potential alternatives to consider:
- Add `khulnasoft test` to your Package.json `test` scripts, to capture them in local `npm test` runs. 
- Add `khulnasoft test` as a `post-install` step in your Package.json file, to immediately spot any newly added module which has known vulnerabilities
- Add `khulnasoft protect` as a `post-install` step in your Package.json file, to apply patches even while working locally

Note: During private beta, all khulnasoft actions require authentication. This means modifying your Package.json will require your entire team to first run `khulnasoft auth`. If you don't want that, hold off on modifying your Package.json file for now. 

## monitor

With `test` and `protect`, you're well setup to address currently known vulnerabilities. However, new vulnerabilities are constantly disclosed - which is where `monitor` comes in.

Just before you deploy, run `khulnasoft monitor` in your project directory. This will post a snapshot of your full dependency tree to Khulnasoft's servers, where they will be stored. Those dependencies will be tracked for newly disclosed vulnerabilities, and we will alert you if a new vulnerability related to those dependencies is disclosed.

```shell
# example uses
cd ~/projects/myproject/
khulnasoft monitor
# a khulnasoft.com monitor response URL is returned
```

## More About Authentication

During the private beta, you will need to authenticate with khulnasoft before being able to use any of it's features. Once public, `test` and `protect` will be available without the need to `auth`.

Authentication requires you to have a GitHub account, but *does not require access to your repositories* - we simply use Github to spare you managing another set of credentials. Run `khulnasoft auth` and follow the on screen instructions.

If you are authenticating on a remote machine, for instance on a build server, you can use your API key from https://khulnasoft.com and authenticate directly on the command line using `khulnasoft auth <key>`. Browse to the [Khulnasoft app](https://app.khulnasoft.com/) to find out your own API key.

## Sample Commands

For easy reference, here is a list of the examples previously mentioned. 

Get Started
```shell
npm install -g khulnasoft
khulnasoft auth
khulnasoft test ionic@1.6.5
```
Test a single local project
```shell
cd ~/projects/myproj/
khulnasoft test
```
Test all projects under a parent folder
```shell
cd ~/projects/
find . -type d -maxdepth 1 | xargs -t -I{} khulnasoft test  {}
```
Test a public package
```shell
khulnasoft test lodash
khulnasoft test ionic@1.6.5
```
Interactive `khulnasoft protect` to address found issues
```shell
khulnasoft protect -i
```
Store a snapshot of current dependencies to monitor for new ones
```shell
# example uses
cd ~/projects/myproject/
khulnasoft monitor
# a khulnasoft.com monitor response URL is returned
```

## Credits

While we use multiple sources to determine vulnerabilities, the primary (current) source is the [Node Security project](http://nodesecurity.io).
