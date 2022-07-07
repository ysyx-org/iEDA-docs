# iEDA-docs
The documentation site for project iEDA, a free and open-source silicon EDA project backed by UCAS and PCL

# Environment Setup

1. Init and update git submodule

	```sh
	git submodule init
	git submodule update
	```

2. Make sure your NodeJS is up to date

	```sh
	node --version // Expected to be at least v18.0.x
	npm --version // Expected to be at least v8.9.x
	```

> OPTIONAL: use npm mirror registries for optimal specified
> ```sh
> npm config set registry=https://registry.npmmirror.com/
> ```

3. Install Dependencies

	```sh
	npm install
	```
# Test and deploy

1. Local preview with live updates

	```sh
	npm run dev
	```

2. Deploy for Production

	You will need an account with appropriate privileges to perform this action. If you do not have an account, please [register](htttps://ysyx.oscc.cc/register) first.

	Its always recommended to keep your working repository clean before deployment.

	The deploy script will ask for a domain at first launch. When asked, please fill in `ysyx.oscc.cc`.

	```
	npm run deploy
	```