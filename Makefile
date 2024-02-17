fuzz-hardhat:
	fuzz -c .fuzz_hardhat.yml arm
	npx hardhat compile
	npx hardhat run --network localhost scripts/deploy.js
	fuzz -c .fuzz_hardhat.yml run
	fuzz -c .fuzz_hardhat.yml disarm

clean:
	rm -rf ./build
	test .scribble-arming.meta.json && fuzz disarm
